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
key_vault=$(jq -r '.postgres.keyVault' "$contract")
key_vault_secret=$(jq -r '.postgres.keyVaultSecret' "$contract")
container_secret=$(jq -r '.postgres.containerSecret' "$contract")
min_replicas=$(jq -r '.scale.minReplicas' "$contract")
max_replicas=$(jq -r '.scale.maxReplicas' "$contract")
revision_mode=$(jq -r '.activeRevisionsMode' "$contract")

app_json=$(az containerapp show --resource-group "$resource_group" --name "$app_name" --output json)
app_id=$(jq -r '.id' <<<"$app_json")
api_version=2024-03-01

# The connection string travels from Key Vault to the management API through
# a mode-600 FIFO. It is not interpolated into a shell command, source file,
# log, process list, or ARM patch argument.
secret_payload_dir=$(mktemp -d)
secret_payload="$secret_payload_dir/container-app-secret.json"
mkfifo -m 600 "$secret_payload"
cleanup_secret_payload() {
  rm -f "$secret_payload"
  rmdir "$secret_payload_dir" 2>/dev/null || true
}
trap cleanup_secret_payload EXIT
(
  az keyvault secret show \
    --vault-name "$key_vault" \
    --name "$key_vault_secret" \
    --query value \
    --output tsv \
    | jq -Rs --arg name "$container_secret" \
      '{properties:{configuration:{secrets:[{name:$name,value:(rtrimstr("\n"))}]}}}' \
      > "$secret_payload"
) &
secret_writer=$!
az rest \
  --method patch \
  --url "https://management.azure.com${app_id}?api-version=${api_version}" \
  --body "@$secret_payload" \
  --output none
wait "$secret_writer"

# Container Apps may serialize a secret update as a short provisioning
# operation. Do not race its template patch or the control plane rejects the
# second update with ContainerAppOperationInProgress.
for attempt in $(seq 1 30); do
  secret_state=$(az containerapp show \
    --resource-group "$resource_group" \
    --name "$app_name" \
    --query properties.provisioningState --output tsv)
  if [[ "$secret_state" == "Succeeded" ]]; then
    break
  fi
  if [[ "$attempt" == 30 ]]; then
    echo "Container Apps did not finish the PostgreSQL secret update." >&2
    exit 1
  fi
  sleep 2
done

app_json=$(az containerapp show --resource-group "$resource_group" --name "$app_name" --output json)

patch=$(jq \
  --arg containerSecret "$container_secret" \
  --arg revisionMode "$revision_mode" \
  --arg image "$image" \
  --argjson minReplicas "$min_replicas" \
  --argjson maxReplicas "$max_replicas" \
  '.properties.template.containers |= map(if .name == "app" then
       .volumeMounts = null |
       .env = (((.env // []) | map(select(.name != "DATABASE_URL"))) + [{name:"DATABASE_URL",secretRef:$containerSecret}]) |
       if $image == "" then . else .image = $image end
     else . end) |
   {properties:{configuration:{activeRevisionsMode:$revisionMode},template:{
     containers:.properties.template.containers,
     scale:{minReplicas:$minReplicas,maxReplicas:$maxReplicas},
     volumes:null
   }}}' <<<"$app_json")

az rest \
  --method patch \
  --url "https://management.azure.com${app_id}?api-version=${api_version}" \
  --body "$patch" \
  --output none

for attempt in $(seq 1 48); do
  state=$(az containerapp show --resource-group "$resource_group" --name "$app_name" --output json)
  replica_count=$(az containerapp replica list \
    --resource-group "$resource_group" \
    --name "$app_name" \
    --revision "$(jq -r '.properties.latestReadyRevisionName // empty' <<<"$state")" \
    --query 'length(@)' --output tsv 2>/dev/null || true)
  if jq -e --arg secret "$container_secret" --arg revisionMode "$revision_mode" \
    --argjson minReplicas "$min_replicas" --argjson maxReplicas "$max_replicas" \
    '.properties.provisioningState == "Succeeded" and
     .properties.latestRevisionName == .properties.latestReadyRevisionName and
     any(.properties.configuration.ingress.traffic[]; .latestRevision == true and .weight == 100) and
     .properties.configuration.activeRevisionsMode == $revisionMode and
     .properties.template.scale.minReplicas == $minReplicas and .properties.template.scale.maxReplicas == $maxReplicas and
     any(.properties.template.containers[]; .name == "app" and any(.env[]; .name == "DATABASE_URL" and .secretRef == $secret)) and
     ((.properties.template.volumes // []) | length == 0) and
     all(.properties.template.containers[]; (.volumeMounts // []) | length == 0)' \
    <<<"$state" >/dev/null && [[ "$replica_count" -ge "$min_replicas" ]]; then
    echo "Deployment contract applied: $min_replicas shared-PostgreSQL replicas with no local data volume."
    exit 0
  fi
  sleep 5
done

echo "Deployment contract did not become ready with the PostgreSQL secret and replica count." >&2
exit 1
