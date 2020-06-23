#!/bin/sh

cd `dirname $0`

IS_CLOUD_INSTALL=`if [ ${CLOUD_MODE} == 1 ]; then echo 'true'; else echo 'false'; fi`

echo "Starting frontend in IS_CLOUD_INSTALL=$IS_CLOUD_INSTALL"

if [ "$ENV" = 'production' ]; then
  cat << EOF > "../build/env.js"
// This file is always replaced during the container startup.
window.env = {
  BACKEND_BASE: "${BACKEND_BASE:-http://localhost:4000/api}",
  SENTRY_DSN: "${SENTRY_DSN}",
  IS_CLOUD_INSTALL: ${IS_CLOUD_INSTALL},
};
EOF
  SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
  SERVICE_PORT=${SERVICE_PORT:-9765}
  envsubst '$SERVICE_PORT $SERVICE_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
  nginx -g 'daemon off;'
else
  cat << EOF > "../public/env.js"
// This file is always replaced during the container startup.
window.env = {
  BACKEND_BASE: "${BACKEND_BASE:-http://localhost:4000/api}",
  SENTRY_DSN: "${SENTRY_DSN}",
  IS_CLOUD_INSTALL: ${IS_CLOUD_INSTALL},
};
EOF
  npm rebuild node-sass
  PORT=${SERVICE_PORT:-9765} npm start
fi
