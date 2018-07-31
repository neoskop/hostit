#!/usr/bin/env bash

(cd /var/lib/clamav && tar --skip-old-files -zxvf /clamav.tgz -C .)
chown clamav:clamav /var/lib/clamav


freshclam
freshclam -d &
clamd &


tee conf.yml << EOL
httpd:
    port: ${PORT}
db:
    type: ${DB_TYPE}
    host: ${DB_HOST}
    port: ${DB_PORT}
    database: ${DB_DATABASE}
    username: ${DB_USER}
    password: ${DB_PASS}
secret: "${SECRET}"
EOL

echo "Waiting for MySQL($DB_HOST)..."
I=1
while ! mysqladmin ping -h"$DB_HOST" --silent; do
    echo "Waiting for MySQL($DB_HOST) #$I..."
    ((I++))
    sleep 5
done

"$@"
