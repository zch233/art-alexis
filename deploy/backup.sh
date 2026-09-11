#!/usr/bin/env bash
source "$(dirname -- "$0")/common.sh"
umask 077
mkdir -p "$deploy_dir/backups"
exec 9>"$deploy_dir/backups/.backup.lock"
flock -n 9 || { echo 'A backup is already running.' >&2; exit 1; }
test -n "$(dc ps --status running -q wordpress)" || { echo 'Website must be running before backup.' >&2; exit 1; }
test -n "$(dc ps --status running -q db)" || { echo 'Database is not running.' >&2; exit 1; }
target="$(mktemp -d "$deploy_dir/backups/$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")"
export BACKUP_DIR="$target"
restart_site() { dc start wordpress >/dev/null || echo 'WARNING: restart WordPress manually.' >&2; }
trap restart_site EXIT
dc stop wordpress
# Only manual CLI operators could write now; do not run imports during backup.
dc exec -T db sh -c 'MYSQL_PWD="$(cat /run/secrets/db_root_password)" exec mysqldump -uroot --single-transaction --quick --no-tablespaces --set-gtid-purged=OFF art_alexis' > "$target/database.sql"
dc run --rm --no-deps archive -c 'tar -czf /backup/site.tar.gz --exclude=./wp-content/plugins/art-alexis --exclude=./wp-content/themes/art-alexis -C /var/www/html .'
dc config --images > "$target/images.txt"
dc config --format json > "$target/release.json"
(cd "$target" && sha256sum database.sql site.tar.gz images.txt release.json > SHA256SUMS)
printf 'Complete backup. Keep this directory private. Save the matching code release and deploy/secrets separately.\n' > "$target/COMPLETE"
echo "Backup complete: $target"
echo 'Copy it to independent storage; this script does not schedule or delete backups.'
