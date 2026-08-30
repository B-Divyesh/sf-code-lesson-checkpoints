#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
contract="$repo_dir/deployment/container-app.json"

for command in az jq; do
  command -v "$command" >/dev/null || { echo "$command is required" >&2; exit 1; }
done

resource_group=$(jq -r '.resourceGroup' "$contract")
environment=$(jq -r '.environment' "$contract")
app_name=$(jq -r '.appName' "$contract")
storage_name=$(jq -r '.sqlite.storageName' "$contract")
volume_name=$(jq -r '.sqlite.volumeName' "$contract")
mount_path=$(jq -r '.sqlite.mountPath' "$contract")
database_url=$(jq -r '.sqlite.databaseUrl' "$contract")
min_replicas=$(jq -r '.scale.minReplicas' "$contract")
max_replicas=$(jq -r '.scale.maxReplicas' "$contract")
revision_mode=$(jq -r '.activeRevisionsMode' "$contract")

az containerapp env storage show \
  --resource-group "$resource_group" \
  --name "$environment" \
  --storage-name "$storage_name" \
  --output none

app_json=$(az containerapp show --resource-group "$resource_group" --name "$app_name" --output json)
app_id=$(jq -r '.id' <<<"$app_json")
api_version=2024-03-01
patch=$(jq \
  --arg storageName "$storage_name" \
  --arg volumeName "$volume_name" \
  --arg mountPath "$mount_path" \
  --arg databaseUrl "$database_url" \
  --arg revisionMode "$revision_mode" \
  --argjson minReplicas "$min_replicas" \
  --argjson maxReplicas "$max_replicas" \
  '.properties.template.containers |= map(if .name == "app" then
       .volumeMounts = [{volumeName:$volumeName,mountPath:$mountPath}] |
       .env = (((.env // []) | map(select(.name != "DATABASE_URL"))) + [{name:"DATABASE_URL",value:$databaseUrl}])
     else . end) |
   {properties:{configuration:{activeRevisionsMode:$revisionMode},template:{
     containers:.properties.template.containers,
     scale:{minReplicas:$minReplicas,maxReplicas:$maxReplicas},
     volumes:[{name:$volumeName,storageType:"AzureFile",storageName:$storageName}]
   }}}' <<<"$app_json")

az rest \
  --method patch \
  --url "https://management.azure.com${app_id}?api-version=${api_version}" \
  --body "$patch" \
  --output none

for attempt in $(seq 1 30); do
  state=$(az containerapp show --resource-group "$resource_group" --name "$app_name" --output json)
  if jq -e --arg mount "$mount_path" --arg volume "$volume_name" --arg storage "$storage_name" --arg database "$database_url" --arg revisionMode "$revision_mode" \
    '.properties.provisioningState == "Succeeded" and
     .properties.latestRevisionName == .properties.latestReadyRevisionName and
     any(.properties.configuration.ingress.traffic[]; .latestRevision == true and .weight == 100) and
     .properties.configuration.activeRevisionsMode == $revisionMode and
     .properties.template.scale.minReplicas == 1 and .properties.template.scale.maxReplicas == 1 and
     any(.properties.template.containers[]; .name == "app" and any(.volumeMounts[]; .volumeName == $volume and .mountPath == $mount)) and
     any(.properties.template.volumes[]; .name == $volume and .storageType == "AzureFile" and .storageName == $storage) and
     any(.properties.template.containers[0].env[]; .name == "DATABASE_URL" and .value == $database)' \
    <<<"$state" >/dev/null; then
    echo "Deployment contract applied: one replica with durable $mount_path storage."
    exit 0
  fi
  sleep 5
done

echo "Deployment contract did not become ready in time." >&2
exit 1
