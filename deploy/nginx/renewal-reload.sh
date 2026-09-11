#!/bin/sh
# Install as an executable Certbot deploy hook on the VPS, not a backup timer.
set -eu
nginx -t
systemctl reload nginx
