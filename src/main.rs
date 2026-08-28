use std::{env, net::SocketAddr, path::PathBuf, time::Duration};

use axum::{
    extract::{DefaultBodyLimit, Path, State},
    http::{header, HeaderMap, HeaderValue, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post, put},
    Json, Router,
};
use rand::{distr::Alphanumeric, Rng};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Row, SqlitePool,
};
use tower_governor::{
    governor::GovernorConfigBuilder, key_extractor::GlobalKeyExtractor, GovernorLayer,
};
use tower_http::{
    compression::CompressionLayer,
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
    set_header::SetResponseHeaderLayer,
    trace::TraceLayer,
};
use tracing::{info, warn};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
    build_sha: String,
}

#[derive(Debug)]
struct ApiError(StatusCode, String);

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(json!({ "error": self.1 }))).into_response()
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        warn!(%error, "database request failed");
        Self(
            StatusCode::INTERNAL_SERVER_ERROR,
            "The checkpoint record could not be loaded. Try again.".into(),
        )
    }
}

type ApiResult<T> = Result<T, ApiError>;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateLesson {
    title: String,
    learner_name: Option<String>,
    checkpoints: Vec<CreateCheckpoint>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateCheckpoint {
    title: String,
    command: String,
    success_hint: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CreatedLesson {
    id: String,
    share_code: String,
    tutor_token: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LessonView {
    id: String,
    title: String,
    learner_name: Option<String>,
    share_code: String,
    created_at: String,
    checkpoints: Vec<CheckpointView>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CheckpointView {
    id: String,
    position: i64,
    title: String,
    command: String,
    success_hint: Option<String>,
    submissions: Vec<SubmissionView>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SubmissionView {
    id: String,
    status: String,
    output: String,
    note: String,
    teacher_reply: Option<String>,
    created_at: String,
    replied_at: Option<String>,
}

#[derive(Deserialize)]
struct SubmitEvidence {
    status: String,
    output: Option<String>,
    note: Option<String>,
    consented: bool,
}

#[derive(Deserialize)]
struct ReplyBody {
    reply: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .json()
        .init();

    let supplied_database_url = env::var("DATABASE_URL").ok();
    let database_url = supplied_database_url
        .as_deref()
        .unwrap_or("sqlite://checkpoints.db?mode=rwc");
    let supplied_build_sha = env::var("BUILD_SHA").ok();
    let build_sha = supplied_build_sha
        .as_deref()
        .unwrap_or("development")
        .to_owned();
    let supplied_dist_dir = env::var("DIST_DIR").ok();
    let dist = PathBuf::from(supplied_dist_dir.as_deref().unwrap_or("dist"));
    // Do not log values: DATABASE_URL can itself contain credentials. This
    // single startup record makes the container's configuration provenance
    // observable without exposing a secret.
    info!(
        database_url = if supplied_database_url.is_some() {
            "supplied"
        } else {
            "default"
        },
        build_sha = if supplied_build_sha.is_some() {
            "supplied"
        } else {
            "default"
        },
        dist_dir = if supplied_dist_dir.is_some() {
            "supplied"
        } else {
            "default"
        },
        "runtime configuration resolved"
    );
    let sqlite_options = database_url
        .parse::<SqliteConnectOptions>()?
        .busy_timeout(Duration::from_secs(30));
    // The deployment contract deliberately runs one SQLite writer. Keeping a
    // single pool connection also avoids competing file locks during an Azure
    // Files-backed revision handoff.
    let db = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(sqlite_options)
        .await?;
    run_migrations(&db).await?;
    let state = AppState { db, build_sha };
    let app = app(state, dist);
    let port = env::var("PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    info!(%addr, "Code Lesson Checkpoints is ready");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown())
        .await?;
    Ok(())
}

async fn run_migrations(db: &SqlitePool) -> anyhow::Result<()> {
    const ATTEMPTS: u8 = 6;
    for attempt in 1..=ATTEMPTS {
        match sqlx::migrate!().run(db).await {
            Ok(()) => return Ok(()),
            Err(error)
                if attempt < ATTEMPTS
                    && error
                        .to_string()
                        .to_ascii_lowercase()
                        .contains("database is locked") =>
            {
                warn!(
                    attempt,
                    max_attempts = ATTEMPTS,
                    "SQLite migration lock is busy; retrying"
                );
                tokio::time::sleep(Duration::from_secs(u64::from(attempt) * 2)).await;
            }
            Err(error) => return Err(error.into()),
        }
    }
    unreachable!("migration retry loop always returns")
}

fn app(state: AppState, dist: PathBuf) -> Router {
    let origins = env::var("CORS_ORIGIN")
        .unwrap_or_else(|_| {
            "https://code-lesson-checkpoints.sociobot.in,http://localhost:5173".into()
        })
        .split(',')
        .filter_map(|s| s.trim().parse::<HeaderValue>().ok())
        .collect::<Vec<_>>();
    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE]);
    let index = dist.join("index.html");
    let static_files = ServeDir::new(&dist).fallback(ServeFile::new(index));
    let immutable_assets = Router::new()
        .fallback_service(ServeDir::new(dist.join("assets")))
        .layer(SetResponseHeaderLayer::overriding(
            header::CACHE_CONTROL,
            HeaderValue::from_static("public, max-age=31536000, immutable"),
        ));
    let mut rate_builder = GovernorConfigBuilder::default();
    rate_builder
        .per_millisecond(10)
        .burst_size(100)
        .methods(vec![Method::POST, Method::PUT, Method::DELETE]);
    let rate_limit = rate_builder
        .key_extractor(GlobalKeyExtractor)
        .finish()
        .expect("valid rate limit");

    Router::new()
        .route("/health", get(health))
        .route("/api/lessons", post(create_lesson))
        .route("/api/lessons/code/{code}", get(get_learner_lesson))
        .route("/api/lessons/code/{code}/checkpoints/{checkpoint_id}/submissions", post(submit_evidence))
        .route("/api/tutor/lessons/{id}", get(get_tutor_lesson).delete(delete_lesson))
        .route("/api/tutor/submissions/{id}/reply", put(reply_to_submission))
        .nest("/assets", immutable_assets)
        .fallback_service(static_files)
        .layer(DefaultBodyLimit::max(64 * 1024))
        .layer(GovernorLayer::new(rate_limit))
        .layer(CompressionLayer::new())
        .layer(cors)
        .layer(SetResponseHeaderLayer::if_not_present(header::X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff")))
        .layer(SetResponseHeaderLayer::if_not_present(header::REFERRER_POLICY, HeaderValue::from_static("strict-origin-when-cross-origin")))
        .layer(SetResponseHeaderLayer::if_not_present(header::CONTENT_SECURITY_POLICY, HeaderValue::from_static("default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self' https://api.sociobot.in https://pilot-api.sociobot.in; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' https://api.sociobot.in")))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn health(State(state): State<AppState>) -> Json<Value> {
    Json(json!({ "status": "ok", "build": state.build_sha }))
}

async fn create_lesson(
    State(state): State<AppState>,
    Json(body): Json<CreateLesson>,
) -> ApiResult<(StatusCode, Json<CreatedLesson>)> {
    let title = clean_required(&body.title, 100, "Lesson title")?;
    if body.checkpoints.is_empty() || body.checkpoints.len() > 12 {
        return Err(ApiError(
            StatusCode::BAD_REQUEST,
            "Add between 1 and 12 checkpoints.".into(),
        ));
    }
    let learner_name = clean_optional(body.learner_name.as_deref(), 80)?;
    let id = Uuid::new_v4().to_string();
    let token = random_string(40);
    let token_hash = hash_token(&token);
    let share_code = create_unique_code(&state.db).await?;
    let mut tx = state.db.begin().await?;
    sqlx::query("INSERT INTO lessons (id, title, learner_name, share_code, tutor_token_hash) VALUES (?, ?, ?, ?, ?)")
        .bind(&id).bind(&title).bind(&learner_name).bind(&share_code).bind(token_hash).execute(&mut *tx).await?;
    for (position, checkpoint) in body.checkpoints.iter().enumerate() {
        let checkpoint_title = clean_required(&checkpoint.title, 100, "Checkpoint title")?;
        let command = clean_required(&checkpoint.command, 500, "Command")?;
        let success_hint = clean_optional(checkpoint.success_hint.as_deref(), 300)?;
        sqlx::query("INSERT INTO checkpoints (id, lesson_id, position, title, command, success_hint) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string()).bind(&id).bind(position as i64 + 1).bind(checkpoint_title).bind(command).bind(success_hint).execute(&mut *tx).await?;
    }
    tx.commit().await?;
    Ok((
        StatusCode::CREATED,
        Json(CreatedLesson {
            id,
            share_code,
            tutor_token: token,
        }),
    ))
}

async fn get_learner_lesson(
    State(state): State<AppState>,
    Path(code): Path<String>,
) -> ApiResult<Json<LessonView>> {
    let code = normalize_code(&code);
    let id = sqlx::query_scalar::<_, String>("SELECT id FROM lessons WHERE share_code = ?")
        .bind(code)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| {
            ApiError(
                StatusCode::NOT_FOUND,
                "That lesson code was not found. Ask your tutor to check it.".into(),
            )
        })?;
    Ok(Json(load_lesson(&state.db, &id).await?))
}

async fn get_tutor_lesson(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> ApiResult<Json<LessonView>> {
    authorize_tutor(&state.db, &id, &headers).await?;
    Ok(Json(load_lesson(&state.db, &id).await?))
}

async fn submit_evidence(
    State(state): State<AppState>,
    Path((code, checkpoint_id)): Path<(String, String)>,
    Json(body): Json<SubmitEvidence>,
) -> ApiResult<(StatusCode, Json<Value>)> {
    if !body.consented {
        return Err(ApiError(
            StatusCode::BAD_REQUEST,
            "Confirm that you reviewed the selected output before sharing.".into(),
        ));
    }
    if body.status != "passed" && body.status != "blocked" {
        return Err(ApiError(
            StatusCode::BAD_REQUEST,
            "Status must be passed or blocked.".into(),
        ));
    }
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM checkpoints c JOIN lessons l ON l.id = c.lesson_id WHERE c.id = ? AND l.share_code = ?")
        .bind(&checkpoint_id).bind(normalize_code(&code)).fetch_one(&state.db).await?;
    if exists == 0 {
        return Err(ApiError(
            StatusCode::NOT_FOUND,
            "That checkpoint is not part of this lesson.".into(),
        ));
    }
    let output = redact_and_cap(body.output.as_deref().unwrap_or(""), 8000);
    let note = clean_optional(body.note.as_deref(), 1000)?.unwrap_or_default();
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO submissions (id, checkpoint_id, status, output, note, consented) VALUES (?, ?, ?, ?, ?, 1)")
        .bind(&id).bind(&checkpoint_id).bind(&body.status).bind(output).bind(note).execute(&state.db).await?;
    sqlx::query("UPDATE lessons SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = (SELECT lesson_id FROM checkpoints WHERE id = ?)")
        .bind(&checkpoint_id).execute(&state.db).await?;
    Ok((
        StatusCode::CREATED,
        Json(json!({ "id": id, "saved": true })),
    ))
}

async fn reply_to_submission(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<ReplyBody>,
) -> ApiResult<Json<Value>> {
    let lesson_id = sqlx::query_scalar::<_, String>("SELECT c.lesson_id FROM submissions s JOIN checkpoints c ON c.id = s.checkpoint_id WHERE s.id = ?")
        .bind(&id).fetch_optional(&state.db).await?
        .ok_or_else(|| ApiError(StatusCode::NOT_FOUND, "That checkpoint update no longer exists.".into()))?;
    authorize_tutor(&state.db, &lesson_id, &headers).await?;
    let reply = clean_required(&body.reply, 2000, "Reply")?;
    sqlx::query("UPDATE submissions SET teacher_reply = ?, replied_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
        .bind(reply).bind(&id).execute(&state.db).await?;
    Ok(Json(json!({ "saved": true })))
}

async fn delete_lesson(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> ApiResult<StatusCode> {
    authorize_tutor(&state.db, &id, &headers).await?;
    sqlx::query("DELETE FROM lessons WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn load_lesson(db: &SqlitePool, id: &str) -> ApiResult<LessonView> {
    let row = sqlx::query(
        "SELECT id, title, learner_name, share_code, created_at FROM lessons WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError(StatusCode::NOT_FOUND, "That lesson was not found.".into()))?;
    let checkpoint_rows = sqlx::query("SELECT id, position, title, command, success_hint FROM checkpoints WHERE lesson_id = ? ORDER BY position")
        .bind(id).fetch_all(db).await?;
    let mut checkpoints = Vec::with_capacity(checkpoint_rows.len());
    for checkpoint in checkpoint_rows {
        let checkpoint_id: String = checkpoint.get("id");
        let submission_rows = sqlx::query("SELECT id, status, output, note, teacher_reply, created_at, replied_at FROM submissions WHERE checkpoint_id = ? ORDER BY created_at DESC")
            .bind(&checkpoint_id).fetch_all(db).await?;
        let submissions = submission_rows
            .into_iter()
            .map(|s| SubmissionView {
                id: s.get("id"),
                status: s.get("status"),
                output: s.get("output"),
                note: s.get("note"),
                teacher_reply: s.get("teacher_reply"),
                created_at: s.get("created_at"),
                replied_at: s.get("replied_at"),
            })
            .collect();
        checkpoints.push(CheckpointView {
            id: checkpoint_id,
            position: checkpoint.get("position"),
            title: checkpoint.get("title"),
            command: checkpoint.get("command"),
            success_hint: checkpoint.get("success_hint"),
            submissions,
        });
    }
    Ok(LessonView {
        id: row.get("id"),
        title: row.get("title"),
        learner_name: row.get("learner_name"),
        share_code: row.get("share_code"),
        created_at: row.get("created_at"),
        checkpoints,
    })
}

async fn authorize_tutor(db: &SqlitePool, lesson_id: &str, headers: &HeaderMap) -> ApiResult<()> {
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or_else(|| {
            ApiError(
                StatusCode::UNAUTHORIZED,
                "Open the private tutor link for this lesson.".into(),
            )
        })?;
    let stored =
        sqlx::query_scalar::<_, String>("SELECT tutor_token_hash FROM lessons WHERE id = ?")
            .bind(lesson_id)
            .fetch_optional(db)
            .await?
            .ok_or_else(|| ApiError(StatusCode::NOT_FOUND, "That lesson was not found.".into()))?;
    if hash_token(token) != stored {
        return Err(ApiError(
            StatusCode::FORBIDDEN,
            "This tutor link is not valid for the lesson.".into(),
        ));
    }
    Ok(())
}

fn clean_required(value: &str, max: usize, label: &str) -> ApiResult<String> {
    let value = value.trim();
    if value.is_empty() {
        return Err(ApiError(
            StatusCode::BAD_REQUEST,
            format!("{label} is required."),
        ));
    }
    if value.chars().count() > max {
        return Err(ApiError(
            StatusCode::BAD_REQUEST,
            format!("{label} must be {max} characters or fewer."),
        ));
    }
    Ok(value.into())
}

fn clean_optional(value: Option<&str>, max: usize) -> ApiResult<Option<String>> {
    match value.map(str::trim).filter(|v| !v.is_empty()) {
        Some(value) if value.chars().count() > max => Err(ApiError(
            StatusCode::BAD_REQUEST,
            format!("Text must be {max} characters or fewer."),
        )),
        Some(value) => Ok(Some(value.into())),
        None => Ok(None),
    }
}

fn normalize_code(code: &str) -> String {
    code.chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .collect::<String>()
        .to_uppercase()
}
fn hash_token(token: &str) -> String {
    blake3::hash(token.as_bytes()).to_hex().to_string()
}
fn random_string(len: usize) -> String {
    rand::rng()
        .sample_iter(&Alphanumeric)
        .take(len)
        .map(char::from)
        .collect()
}

async fn create_unique_code(db: &SqlitePool) -> ApiResult<String> {
    const ALPHABET: &[u8] = b"23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    for _ in 0..10 {
        let code: String = (0..6)
            .map(|_| ALPHABET[rand::rng().random_range(0..ALPHABET.len())] as char)
            .collect();
        if sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM lessons WHERE share_code = ?")
            .bind(&code)
            .fetch_one(db)
            .await?
            == 0
        {
            return Ok(code);
        }
    }
    Err(ApiError(
        StatusCode::INTERNAL_SERVER_ERROR,
        "Could not create a share code. Try again.".into(),
    ))
}

fn redact_and_cap(value: &str, max: usize) -> String {
    let secret = Regex::new(r"(?i)((?:(?:api[_-]?key|token|secret|password|pass|pwd|credentials?|database(?:[_-]?url)?|(?:db|redis|mongo|postgres|pg)[_-]?url|connection[_-]?string|dsn)|[a-z][a-z0-9_-]*?(?:api[_-]?key|token|secret|password|pass|pwd|credentials?|database(?:[_-]?url)?|(?:db|redis|mongo|postgres|pg)[_-]?url|connection[_-]?string|dsn))\s*[=:]\s*)([^\s]+)")
        .expect("valid secret regex");
    let authorization = Regex::new(r"(?i)(authorization\s*:\s*)(?:bearer\s+)?([^\s]+)")
        .expect("valid authorization regex");
    let bearer = Regex::new(r"(?i)bearer\s+[a-z0-9._~+/=-]{12,}").expect("valid bearer regex");
    let url_credentials = Regex::new(r"(?i)(\b[a-z][a-z0-9+.-]*://)(?:[^\s/@:]+(?::[^\s/@]*)?@)")
        .expect("valid URL credential regex");
    let cleaned = authorization.replace_all(value, "$1[redacted]");
    let cleaned = bearer.replace_all(&cleaned, "Bearer [redacted]");
    let cleaned = secret.replace_all(&cleaned, "$1[redacted]");
    let cleaned = url_credentials.replace_all(&cleaned, "$1[redacted]@");
    let mut result: String = cleaned.chars().take(max).collect();
    if cleaned.chars().count() > max {
        result.push_str("\n… [output trimmed]");
    }
    result
}

async fn shutdown() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("install Ctrl+C handler")
    };
    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("install SIGTERM handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::{to_bytes, Body},
        http::Request,
    };
    use tower::ServiceExt;

    #[test]
    fn redacts_common_secrets_and_caps_output() {
        let value = "API_KEY=supersecret\nAuthorization: Bearer abcdefghijklmnopqrstuvwxyz\nDATABASE_URL=postgres://qa_user:qa_password@db.example/private\nredis://cache_user:cache_password@cache.example/0\nok";
        let redacted = redact_and_cap(value, 200);
        assert!(!redacted.contains("supersecret"));
        assert!(!redacted.contains("abcdefghijklmnopqrstuvwxyz"));
        assert!(!redacted.contains("qa_user"));
        assert!(!redacted.contains("qa_password"));
        assert!(!redacted.contains("cache_password"));
        assert!(redacted.contains("[redacted]"));
    }

    #[test]
    fn normalizes_share_codes() {
        assert_eq!(normalize_code("ab-12 cd"), "AB12CD");
    }

    #[tokio::test]
    async fn unnamed_lesson_tutor_link_can_read_reply_and_delete() {
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::migrate!().run(&db).await.unwrap();
        let service = app(
            AppState {
                db,
                build_sha: "test".into(),
            },
            PathBuf::from("dist"),
        );
        let create = Request::builder().method("POST").uri("/api/lessons").header("content-type", "application/json")
            .body(Body::from(r#"{"title":"HTTP debugging","checkpoints":[{"title":"Run tests","command":"npm test","successHint":"Tests pass"}]}"#)).unwrap();
        let response = service.clone().oneshot(create).await.unwrap();
        assert_eq!(response.status(), StatusCode::CREATED);
        let created: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 64 * 1024).await.unwrap())
                .unwrap();
        let code = created["shareCode"].as_str().unwrap();
        let id = created["id"].as_str().unwrap();
        let token = created["tutorToken"].as_str().unwrap();

        let get = Request::builder()
            .uri(format!("/api/lessons/code/{code}"))
            .body(Body::empty())
            .unwrap();
        let response = service.clone().oneshot(get).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let lesson: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 64 * 1024).await.unwrap())
                .unwrap();
        assert!(lesson["learnerName"].is_null());
        let checkpoint_id = lesson["checkpoints"][0]["id"].as_str().unwrap();

        let submit = Request::builder().method("POST").uri(format!("/api/lessons/code/{code}/checkpoints/{checkpoint_id}/submissions"))
            .header("content-type", "application/json").body(Body::from(r#"{"status":"blocked","output":"DATABASE_URL=postgres://qa_user:qa_password@db.example/private","note":"I expected green tests","consented":true}"#)).unwrap();
        assert_eq!(
            service.clone().oneshot(submit).await.unwrap().status(),
            StatusCode::CREATED
        );

        let tutor = Request::builder()
            .uri(format!("/api/tutor/lessons/{id}"))
            .header("authorization", format!("Bearer {token}"))
            .body(Body::empty())
            .unwrap();
        let response = service.clone().oneshot(tutor).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let lesson: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 64 * 1024).await.unwrap())
                .unwrap();
        assert_eq!(
            lesson["checkpoints"][0]["submissions"][0]["output"],
            "DATABASE_URL=[redacted]"
        );
        assert_eq!(
            lesson["checkpoints"][0]["submissions"][0]["note"],
            "I expected green tests"
        );

        let submission_id = lesson["checkpoints"][0]["submissions"][0]["id"]
            .as_str()
            .unwrap();
        let reply = Request::builder()
            .method("PUT")
            .uri(format!("/api/tutor/submissions/{submission_id}/reply"))
            .header("authorization", format!("Bearer {token}"))
            .header("content-type", "application/json")
            .body(Body::from(
                r#"{"reply":"Check your database configuration."}"#,
            ))
            .unwrap();
        assert_eq!(
            service.clone().oneshot(reply).await.unwrap().status(),
            StatusCode::OK
        );

        let delete = Request::builder()
            .method("DELETE")
            .uri(format!("/api/tutor/lessons/{id}"))
            .header("authorization", format!("Bearer {token}"))
            .body(Body::empty())
            .unwrap();
        assert_eq!(
            service.oneshot(delete).await.unwrap().status(),
            StatusCode::NO_CONTENT
        );
    }

    #[tokio::test]
    async fn hashed_assets_receive_an_immutable_cache_policy() {
        let fixture = std::env::temp_dir().join(format!("clc-assets-{}", Uuid::new_v4()));
        let assets = fixture.join("assets");
        std::fs::create_dir_all(&assets).unwrap();
        std::fs::write(assets.join("index-ABC123.js"), "console.log('fixture')").unwrap();
        let service = app(
            AppState {
                db: SqlitePoolOptions::new()
                    .max_connections(1)
                    .connect("sqlite::memory:")
                    .await
                    .unwrap(),
                build_sha: "test".into(),
            },
            fixture.clone(),
        );
        let response = service
            .oneshot(
                Request::builder()
                    .uri("/assets/index-ABC123.js")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers().get(header::CACHE_CONTROL).unwrap(),
            "public, max-age=31536000, immutable"
        );
        std::fs::remove_dir_all(fixture).unwrap();
    }

    #[tokio::test]
    async fn migration_retry_helper_accepts_an_already_migrated_database() {
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        run_migrations(&db).await.unwrap();
        run_migrations(&db).await.unwrap();
        let lesson_table = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'lessons'",
        )
        .fetch_one(&db)
        .await
        .unwrap();
        assert_eq!(lesson_table, 1);
    }
}
