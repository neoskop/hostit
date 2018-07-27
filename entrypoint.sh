#!/usr/bin/env bash

tee conf.yml << EOL
httpd:
    port: ${PORT}
db:
    type: ${DB_TYPE}
    host: ${DB_HOST}
    port: ${DB_PORT}
    database: ${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASS}
EOL

echo "Waiting for MySQL($DB_HOST)..."
I=1
while ! mysqladmin ping -h"$DB_HOST" --silent; do
    echo "Waiting for MySQL($DB_HOST) #$I..."
    ((I++))
    sleep 5
done

"$@"
