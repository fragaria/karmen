#!/bin/bash

MYDIR="$(dirname "$(readlink -f "$0")")"

SERVICE_PORT=${SERVICE_PORT:-9768}
SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
envsubst '$SERVICE_PORT $SERVICE_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
/usr/sbin/nginx -g "daemon off;"