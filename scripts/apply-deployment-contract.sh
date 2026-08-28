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
min_replicas=$(jq -r '.scale.minReplicas' "$contract")
max_replicas=$(jq -r '.scale.maxReplicas' "$contract")

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
  --argjson minReplicas "$min_replicas" \
  --argjson maxReplicas "$max_replicas" \
  '.properties.template.containers |= map(if .name == "app" then .volumeMounts = [{volumeName:$volumeName,mountPath:$mountPath}] else . end) |
   {properties:{template:{
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
  state=$(az containerapp show --resource-group "$resource_group" --name "$app_name" \
    --query "{provisioning:properties.provisioningState,min:properties.template.scale.minReplicas,max:properties.template.scale.maxReplicas,mount:properties.template.containers[0].volumeMounts[0].mountPath,storage:properties.template.volumes[0].storageName}" \
    --output json)
  if jq -e --arg mount "$mount_path" --arg storage "$storage_name" \
    '.provisioning == "Succeeded" and .min == 1 and .max == 1 and .mount == $mount and .storage == $storage' \
    <<<"$state" >/dev/null; then
    echo "Deployment contract applied: one replica with durable $mount_path storage."
    exit 0
  fi
  sleep 5
done

echo "Deployment contract did not become ready in time." >&2
exit 1
