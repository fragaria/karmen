#!/bin/sh

set -x

trap 'exit_code=$?; echo "ERROR: Exiting on error $exit_code" >&2; exit $exit_code' ERR

cd `dirname $0`

IS_CLOUD_INSTALL=`if [ ${CLOUD_MODE} == 1 ]; then echo 'true'; else echo 'false'; fi`

echo "Starting frontend in IS_CLOUD_INSTALL=$IS_CLOUD_INSTALL"

ENV_JSON="
// This file is always replaced during the container startup.
window.env = {
  BACKEND_BASE: '${BACKEND_BASE:-http://localhost:8000/api/2}',
  SENTRY_DSN: '${FRONTEND_SENTRY_DSN}',
  IS_CLOUD_INSTALL: ${IS_CLOUD_INSTALL},
};"

if [ "$ENV" = 'production' ]; then
  echo "$ENV_JSON" > "../build/env.js"
  SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
  SERVICE_PORT=${SERVICE_PORT:-9765}
  envsubst '$SERVICE_PORT $SERVICE_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
  nginx -g 'daemon off;'
else
  echo "$ENV_JSON" >  "../public/env.js"
  npm rebuild node-sass
  PORT=${SERVICE_PORT:-9765} npm start
fi
