FROM node:22-bookworm-slim AS web
WORKDIR /build
COPY package.json package-lock.json tsconfig.json vite.config.ts ./
COPY frontend ./frontend
COPY extension ./extension
COPY public ./public
RUN npm ci && npm run build

FROM rust:1.98-bookworm AS backend
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY migrations ./migrations
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app app \
    && mkdir -p /app/dist /data \
    && chown -R app:app /app /data
WORKDIR /app
COPY --from=backend /build/target/release/code-lesson-checkpoints /usr/local/bin/code-lesson-checkpoints
COPY --from=web /build/dist ./dist
ENV PORT=8080 DATABASE_URL=sqlite:///data/checkpoints.db?mode=rwc DIST_DIR=/app/dist
USER app
EXPOSE 8080
VOLUME ["/data"]
CMD ["code-lesson-checkpoints"]
