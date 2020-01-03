#!/bin/sh
if [ "$ENV" = 'production' ]; then
  npm run build-env-file
  SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
  SERVICE_PORT=${SERVICE_PORT:-9765}
  envsubst '$SERVICE_PORT $SERVICE_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
  nginx -g 'daemon off;'
else
  npm rebuild node-sass
  PORT=${SERVICE_PORT:-9765} npm start
fi
