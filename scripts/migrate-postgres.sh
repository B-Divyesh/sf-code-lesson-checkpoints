#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
contract="$repo_dir/deployment/container-app.json"

for command in az cargo jq; do
  command -v "$command" >/dev/null || { echo "$command is required" >&2; exit 1; }
done

key_vault=$(jq -r '.postgres.keyVault' "$contract")
migration_secret=$(jq -r '.postgres.migrationKeyVaultSecret' "$contract")
migration_url=$(az keyvault secret show \
  --vault-name "$key_vault" \
  --name "$migration_secret" \
  --query value \
  --output tsv)

# MIGRATE_ONLY returns immediately after applying the product-owned schema.
# The privileged URL exists only in this process; the serving container gets
# the separate runtime secret reference from apply-deployment-contract.sh.
MIGRATE_ONLY=1 DATABASE_URL="$migration_url" \
  cargo run --quiet --release --manifest-path "$repo_dir/Cargo.toml"
unset migration_url
echo "PostgreSQL schema migration completed."
