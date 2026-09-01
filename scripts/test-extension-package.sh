#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
package_dir=$(mktemp -d)
trap 'rm -rf "$package_dir"' EXIT
package="$package_dir/code-lesson-checkpoints.vsix"
consumer="$package_dir/consumer"

npm --prefix "$repo_dir" run build:extension
(
  cd "$repo_dir/extension"
  "$repo_dir/node_modules/.bin/vsce" package --no-dependencies --out "$package"
)
unzip -q "$package" -d "$consumer"

test -f "$consumer/extension/dist/extension.js"
test -f "$consumer/extension/LICENSE.txt"
test ! -f "$consumer/extension/dist/privacy.test.js"
cmp "$repo_dir/extension/LICENSE" "$consumer/extension/LICENSE.txt"
node --check "$consumer/extension/dist/extension.js"

echo "Extension package passed: VSIX integrity, declared entry, license, and consumer syntax."
