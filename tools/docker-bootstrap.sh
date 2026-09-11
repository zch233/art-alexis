#!/bin/sh
set -eu
if [ ! -f wp-config.php ]; then
  wp config create --dbname="$WORDPRESS_DB_NAME" --dbuser="$WORDPRESS_DB_USER" --dbpass="$WORDPRESS_DB_PASSWORD" --dbhost="$WORDPRESS_DB_HOST" --skip-check
fi
if ! wp core is-installed >/dev/null 2>&1; then
  wp core install --url=http://127.0.0.1:9401 --title=ALEXIS --admin_user=admin --admin_password="$AA_ADMIN_PASSWORD" --admin_email=admin@localhost.test --skip-email
fi
wp plugin activate art-alexis
wp theme activate art-alexis
wp eval-file /aa-init.php
wp language core install zh_CN --activate
wp core version
