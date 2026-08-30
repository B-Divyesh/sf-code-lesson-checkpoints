#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
contract="$repo_dir/deployment/container-app.json"
image=${1:-}

for command in az jq; do
  command -v "$command" >/dev/null || { echo "$command is required" >&2; exit 1; }
done

resource_group=$(jq -r '.resourceGroup' "$contract")
app_name=$(jq -r '.appName' "$contract")
volume_name=$(jq -r '.storage.volumeName' "$contract")
storage_name=$(jq -r '.storage.storageName' "$contract")
data_dir=$(jq -r '.dataDir' "$contract")
min_replicas=$(jq -r '.scale.minReplicas' "$contract")
max_replicas=$(jq -r '.scale.maxReplicas' "$contract")
revision_mode=$(jq -r '.activeRevisionsMode' "$contract")

if [[ -z "$image" ]]; then
  echo "Usage: scripts/apply-deployment-contract.sh <immutable-image-reference>" >&2
  exit 1
fi

# A non-ready mounted revision can retain an Azure Files advisory lock after
# it stops serving. Retire only stale *mounted* revisions before creating the
# next candidate, while leaving an unmounted healthy revision available until
# the mounted candidate proves ready. This keeps SQLite to one writer.
mounted_stale_revisions=$(az containerapp revision list \
  --resource-group "$resource_group" \
  --name "$app_name" \
  --query "[?properties.active && contains((properties.template.containers[0].volumeMounts || \`[]\`)[].mountPath, '$data_dir')].name" \
  --output tsv)
while IFS= read -r stale_revision; do
  if [[ -n "$stale_revision" ]]; then
    az containerapp revision deactivate \
      --resource-group "$resource_group" \
      --name "$app_name" \
      --revision "$stale_revision" \
      --output none
  fi
done <<<"$mounted_stale_revisions"

# Replace the full application environment without retrieving it first. This
# removes the stale connection setting without ever reading, interpolating, or
# logging its value. The service is designed to run with only PORT.
az containerapp update \
  --resource-group "$resource_group" \
  --name "$app_name" \
  --container-name app \
  --replace-env-vars PORT=8080 \
  --output none

# Read only the product app's ARM identifier. In particular, do not retrieve
# its template/environment because the stale setting must remain unread while
# it is removed above.
app_id=$(az containerapp show --resource-group "$resource_group" --name "$app_name" --query id --output tsv)
api_version=2024-03-01

# The product has one serving process and one durable state boundary. This is
# a complete, explicit template: one named container, PORT only, one Azure
# Files mount, and one replica. No existing app configuration is copied in.
patch=$(jq -n \
  --arg volumeName "$volume_name" \
  --arg storageName "$storage_name" \
  --arg dataDir "$data_dir" \
  --arg revisionMode "$revision_mode" \
  --arg image "$image" \
  --argjson minReplicas "$min_replicas" \
  --argjson maxReplicas "$max_replicas" \
  '{properties:{configuration:{activeRevisionsMode:$revisionMode},template:{
     containers:[{
       name:"app",
       image:$image,
       resources:{cpu:0.5,memory:"1Gi"},
       env:[{name:"PORT",value:"8080"}],
       volumeMounts:[{volumeName:$volumeName,mountPath:$dataDir}]
     }],
     scale:{minReplicas:$minReplicas,maxReplicas:$maxReplicas},
     volumes:[{name:$volumeName,storageType:"AzureFile",storageName:$storageName}]
   }}}')

az rest \
  --method patch \
  --url "https://management.azure.com${app_id}?api-version=${api_version}" \
  --body "$patch" \
  --output none

for attempt in $(seq 1 48); do
  state=$(az containerapp show --resource-group "$resource_group" --name "$app_name" --output json)
  revision=$(jq -r '.properties.latestReadyRevisionName // empty' <<<"$state")
  replica_count=$(az containerapp replica list \
    --resource-group "$resource_group" \
    --name "$app_name" \
    --revision "$revision" \
    --query 'length(@)' --output tsv 2>/dev/null || true)
  if jq -e --arg volume "$volume_name" --arg storage "$storage_name" --arg dataDir "$data_dir" --arg revisionMode "$revision_mode" --arg image "$image" \
    --argjson minReplicas "$min_replicas" --argjson maxReplicas "$max_replicas" \
    '.properties.provisioningState == "Succeeded" and
     .properties.latestRevisionName == .properties.latestReadyRevisionName and
     any(.properties.configuration.ingress.traffic[]; .latestRevision == true and .weight == 100) and
     .properties.configuration.activeRevisionsMode == $revisionMode and
     .properties.template.scale.minReplicas == $minReplicas and .properties.template.scale.maxReplicas == $maxReplicas and
     ((.properties.template.volumes // []) | any(.name == $volume and .storageType == "AzureFile" and .storageName == $storage)) and
     any(.properties.template.containers[]; .name == "app" and
       .image == $image and
       (.env == [{name:"PORT",value:"8080"}]) and
       (.volumeMounts == [{volumeName:$volume,mountPath:$dataDir}]))' \
    <<<"$state" >/dev/null && [[ "$replica_count" == "$min_replicas" ]]; then
    active_revisions=$(az containerapp revision list \
      --resource-group "$resource_group" \
      --name "$app_name" \
      --query '[?properties.active].name' \
      --output tsv)
    while IFS= read -r active_revision; do
      if [[ -n "$active_revision" && "$active_revision" != "$revision" ]]; then
        az containerapp revision deactivate \
          --resource-group "$resource_group" \
          --name "$app_name" \
          --revision "$active_revision" \
          --output none
      fi
    done <<<"$active_revisions"
    remaining_active=$(az containerapp revision list \
      --resource-group "$resource_group" \
      --name "$app_name" \
      --query '[?properties.active].name' \
      --output tsv | sed '/^$/d' | wc -l | tr -d ' ')
    if [[ "$remaining_active" == "1" ]]; then
      echo "Deployment contract applied: PORT only, one durable /data mount, and one serving replica."
      exit 0
    fi
  fi
  sleep 5
done

echo "Deployment contract did not become ready with its durable single-replica boundary." >&2
exit 1
