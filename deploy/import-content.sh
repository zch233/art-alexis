#!/usr/bin/env bash
source "$(dirname -- "$0")/common.sh"
test "$#" -eq 2 || { echo 'Usage: bash deploy/import-content.sh /absolute/content-backup new-project-name' >&2; exit 1; }
backup_path="$(cd -- "$1" && pwd)"
target_project="$2"
[[ "$target_project" =~ ^[a-z0-9][a-z0-9_-]{2,62}$ ]] || { echo 'Invalid project name.' >&2; exit 1; }
test -f "$backup_path/COMPLETE" && test "$(cat "$backup_path/format.txt")" = art-alexis-content-v1 || { echo 'Not a complete content backup.' >&2; exit 1; }
(cd "$backup_path" && sha256sum -c SHA256SUMS)
test -z "$(docker ps -aq --filter "label=com.docker.compose.project=$target_project")" || { echo 'Existing target containers: overwrite refused.' >&2; exit 1; }
test -z "$(docker volume ls -q --filter "label=com.docker.compose.project=$target_project")" || { echo 'Existing target volumes: overwrite refused.' >&2; exit 1; }
export COMPOSE_PROJECT_NAME="$target_project" BACKUP_DIR="$backup_path"
# Keep nginx disabled while restoring. Only localhost can reach the backend.
dc up -d --wait db wordpress
dc stop wordpress
dc exec -T db sh -c 'MYSQL_PWD="$(cat /run/secrets/db_root_password)" exec mysql -uroot art_alexis' < "$backup_path/database.sql"
dc run --rm --no-deps archive -c 'set -eu; tar -xzf /backup/media.tar.gz -C /var/www/html/wp-content; chown -R 33:33 /var/www/html/wp-content/uploads; if [ -d /var/www/html/wp-content/languages ]; then chown -R 33:33 /var/www/html/wp-content/languages; fi'
dc run --rm --no-deps --entrypoint sh cli /aa-finalize-content.sh
dc up -d --wait wordpress
echo "Content restored into $target_project. Old passwords/sessions rotated; use the newly configured admin/editor credentials."
echo 'Nginx is not installed or enabled by this script. Keep this project name in deploy/.env before running future backup/update commands.'
