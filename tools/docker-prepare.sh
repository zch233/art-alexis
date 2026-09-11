#!/bin/sh
set -eu
cd /var/www/html
# Never rewrite an installed site's core. A separate marker avoids mistaking a
# partially extracted download for a completed installation.
if [ -f wp-config.php ]; then exit 0; fi
if [ ! -f .aa-core-ready ]; then
  # Native tar preserves long core filenames; the bundled PHP extractor does
  # not reliably handle the long names in this WordPress release.
  archive="$(mktemp /tmp/aa-wordpress-XXXXXX)"
  curl --fail --location --retry 3 --connect-timeout 30 --max-time 300 https://wordpress.org/wordpress-7.1.tar.gz --output "$archive"
  tar -xzf "$archive" --strip-components=1 -C /var/www/html
  php -d memory_limit=512M /usr/local/bin/wp core verify-checksums --allow-root --version=7.1 --locale=en_US
  mkdir -p wp-content/uploads
  chown -R 33:33 wp-admin wp-includes wp-content/uploads
  chown 33:33 . wp-content ./*.php
  touch .aa-core-ready
fi
