#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
contract="$repo_dir/deployment/container-app.json"
source_sha=${1:-}

for command in az curl git jq npm; do
  command -v "$command" >/dev/null || { echo "$command is required" >&2; exit 1; }
done

if [[ ! "$source_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: scripts/deploy-release.sh <40-character-source-commit>" >&2
  exit 1
fi
if [[ $(git -C "$repo_dir" rev-parse HEAD) != "$source_sha" ]]; then
  echo "The deployment SHA must match the checked-out HEAD." >&2
  exit 1
fi
if [[ -n $(git -C "$repo_dir" status --short) ]]; then
  echo "Commit the worktree before deploying it." >&2
  exit 1
fi

resource_group=$(jq -r '.resourceGroup' "$contract")
app_name=$(jq -r '.appName' "$contract")
registry=$(jq -r '.registry' "$contract")
image_repository=$(jq -r '.imageRepository' "$contract")
base_url=$(jq -r '.publicUrl' "$contract")
image_tag=${source_sha:0:12}
image="$registry.azurecr.io/$image_repository:$image_tag"

az acr build \
  --registry "$registry" \
  --image "$image_repository:$image_tag" \
  --build-arg "BUILD_SHA=$source_sha" \
  --build-arg "GIT_SHA=$source_sha" \
  --build-arg "SOURCE_COMMIT=$source_sha" \
  "$repo_dir"

"$repo_dir/scripts/migrate-postgres.sh"

runtime_database_url=$(az keyvault secret show \
  --vault-name "$(jq -r '.postgres.keyVault' "$contract")" \
  --name "$(jq -r '.postgres.keyVaultSecret' "$contract")" \
  --query value --output tsv)
POSTGRES_RUNTIME_URL="$runtime_database_url" npm --prefix "$repo_dir" run test:postgres-coherence
unset runtime_database_url

canary=''
cleanup_canary() {
  if [[ -n "$canary" ]]; then
    canary_id=$(jq -r '.id' <<<"$canary")
    canary_token=$(jq -r '.tutorToken' <<<"$canary")
    curl --silent --show-error --request DELETE \
      --header "Authorization: Bearer $canary_token" \
      "$base_url/api/tutor/lessons/$canary_id" >/dev/null || true
  fi
}
trap cleanup_canary EXIT

# Apply the image, shared database secret, and three-replica topology in one
# revision. Updating the image first would briefly start it against the old
# per-replica SQLite boundary, recreating the exact data-loss failure.
"$repo_dir/scripts/apply-deployment-contract.sh" "$image"

for attempt in $(seq 1 60); do
  live_build=$(curl --silent --show-error "$base_url/health" | jq -r '.build // empty' || true)
  if [[ "$live_build" == "$source_sha" ]]; then
    break
  fi
  if [[ "$attempt" == 60 ]]; then
    echo "Live health did not report source commit $source_sha." >&2
    exit 1
  fi
  sleep 5
done

# Persist a record before restarting every serving process. Reading and
# deleting it afterwards proves that a revision restart does not create a
# private replica-local state boundary.
canary=$(curl --fail-with-body --silent --show-error \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{"title":"Revision persistence canary","checkpoints":[{"title":"Keep the record","command":"npm test","successHint":"Every restarted replica can read this lesson"}]}' \
  "$base_url/api/lessons")
revision=$(az containerapp show \
  --resource-group "$resource_group" \
  --name "$app_name" \
  --query 'properties.latestReadyRevisionName' --output tsv)
az containerapp revision restart \
  --resource-group "$resource_group" \
  --name "$app_name" \
  --revision "$revision" \
  --output none
canary_code=$(jq -r '.shareCode' <<<"$canary")
canary_id=$(jq -r '.id' <<<"$canary")
canary_token=$(jq -r '.tutorToken' <<<"$canary")
for attempt in $(seq 1 60); do
  status=$(curl --silent --show-error --http1.1 --no-keepalive \
    --output /dev/null --write-out '%{http_code}' \
    "$base_url/api/lessons/code/$canary_code?restart=$attempt")
  if [[ "$status" == 200 ]]; then
    break
  fi
  if [[ "$attempt" == 60 ]]; then
    echo "Revision restart canary did not become readable." >&2
    exit 1
  fi
  sleep 2
done
for attempt in $(seq 1 24); do
  status=$(curl --silent --show-error --http1.1 --no-keepalive \
    --output /dev/null --write-out '%{http_code}' \
    "$base_url/api/tutor/lessons/$canary_id?restart=$attempt" \
    --header "Authorization: Bearer $canary_token")
  if [[ "$status" != 200 ]]; then
    echo "Revision restart canary read $attempt returned $status." >&2
    exit 1
  fi
done

BASE_URL="$base_url" \
  EXPECTED_BUILD_SHA="$source_sha" \
  COHERENCE_CYCLES="$(jq -r '.coherenceProbe.cycles' "$contract")" \
  MINIMUM_DISTINCT_REPLICAS="$(jq -r '.coherenceProbe.minimumDistinctReplicas' "$contract")" \
  npm --prefix "$repo_dir" run test:coherence
echo "Release $source_sha is live with shared PostgreSQL lesson state across replicas."
