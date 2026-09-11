#!/bin/sh
set -eu
source_url="$(cat /content-backup/source-url.txt)"
case "$SITE_URL" in http://*|https://*) ;; *) echo 'SITE_URL must be http(s).' >&2; exit 1;; esac
case "$source_url" in http://*|https://*) ;; *) echo 'Invalid backup source URL.' >&2; exit 1;; esac
wp core update-db
wp plugin activate art-alexis
wp theme activate art-alexis
wp search-replace "$source_url" "$SITE_URL" --all-tables-with-prefix --skip-columns=guid --dry-run
wp search-replace "$source_url" "$SITE_URL" --all-tables-with-prefix --skip-columns=guid
wp option update home "$SITE_URL"
wp option update siteurl "$SITE_URL"
wp eval-file /aa-import-users.php
wp rewrite structure '/%postname%/'
wp option update blog_public 0
wp cache flush
