#!/usr/bin/env bash
# Source from the manual Linux VPS scripts, never from an HTTP endpoint.
set -euo pipefail
deploy_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
dc() { (cd "$deploy_dir" && docker compose --env-file .env -f compose.yaml "$@"); }
test -f "$deploy_dir/.env" || { echo 'Create deploy/.env from .env.example first.' >&2; exit 1; }
