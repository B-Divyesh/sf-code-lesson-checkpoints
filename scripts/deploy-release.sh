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

# Write first, then restart the one serving revision. A successful read after
# the new process is ready proves that the SQLite file came from /data rather
# than an instance-local filesystem.
canary=$(curl --fail-with-body --silent --show-error \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{"title":"Revision persistence canary","checkpoints":[{"title":"Keep the record","command":"npm test","successHint":"The restarted service opens this lesson"}]}' \
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
  npm --prefix "$repo_dir" run test:coherence
echo "Release $source_sha is live with durable SQLite state under /data."
