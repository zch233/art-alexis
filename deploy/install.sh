#!/bin/sh
set -eu
test -f wp-config.php || { echo 'Start WordPress first and wait for core/config initialization.' >&2; exit 1; }
if ! wp core is-installed >/dev/null 2>&1; then
  wp core install --url="$SITE_URL" --title=ALEXIS --admin_user="$ADMIN_LOGIN" --admin_password="$(cat /run/secrets/admin_password)" --admin_email="$ADMIN_EMAIL" --skip-email
fi
wp plugin activate art-alexis
wp theme activate art-alexis
wp eval-file /aa-initialize.php
wp rewrite structure '/%postname%/'
wp rewrite flush --hard
wp language core install zh_CN --activate
wp core version
