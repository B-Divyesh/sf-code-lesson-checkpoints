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

app_json=$(az containerapp show --resource-group "$resource_group" --name "$app_name" --output json)
app_id=$(jq -r '.id' <<<"$app_json")
api_version=2024-03-01

# The product has one serving process and one durable state boundary. Keep
# only PORT in the application environment; all lesson state is an SQLite file
# on the product-owned Azure Files mount at /data.
patch=$(jq \
  --arg volumeName "$volume_name" \
  --arg storageName "$storage_name" \
  --arg dataDir "$data_dir" \
  --arg revisionMode "$revision_mode" \
  --arg image "$image" \
  --argjson minReplicas "$min_replicas" \
  --argjson maxReplicas "$max_replicas" \
  '.properties.template.containers |= map(if .name == "app" then
       .volumeMounts = [{volumeName:$volumeName,mountPath:$dataDir}] |
       .env = [{name:"PORT",value:"8080"}] |
       if $image == "" then . else .image = $image end
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

for attempt in $(seq 1 48); do
  state=$(az containerapp show --resource-group "$resource_group" --name "$app_name" --output json)
  revision=$(jq -r '.properties.latestReadyRevisionName // empty' <<<"$state")
  replica_count=$(az containerapp replica list \
    --resource-group "$resource_group" \
    --name "$app_name" \
    --revision "$revision" \
    --query 'length(@)' --output tsv 2>/dev/null || true)
  if jq -e --arg volume "$volume_name" --arg storage "$storage_name" --arg dataDir "$data_dir" --arg revisionMode "$revision_mode" \
    --argjson minReplicas "$min_replicas" --argjson maxReplicas "$max_replicas" \
    '.properties.provisioningState == "Succeeded" and
     .properties.latestRevisionName == .properties.latestReadyRevisionName and
     any(.properties.configuration.ingress.traffic[]; .latestRevision == true and .weight == 100) and
     .properties.configuration.activeRevisionsMode == $revisionMode and
     .properties.template.scale.minReplicas == $minReplicas and .properties.template.scale.maxReplicas == $maxReplicas and
     ((.properties.template.volumes // []) | any(.name == $volume and .storageType == "AzureFile" and .storageName == $storage)) and
     any(.properties.template.containers[]; .name == "app" and
       (.env == [{name:"PORT",value:"8080"}]) and
       (.volumeMounts == [{volumeName:$volume,mountPath:$dataDir}]))' \
    <<<"$state" >/dev/null && [[ "$replica_count" == "$min_replicas" ]]; then
    echo "Deployment contract applied: one durable /data mount and one serving replica."
    exit 0
  fi
  sleep 5
done

echo "Deployment contract did not become ready with its durable single-replica boundary." >&2
exit 1
