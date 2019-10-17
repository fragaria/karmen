#!/bin/sh
if [ "$ENV" = 'production' ]; then
  npm run build-env-file
  sed -i "s/~~SERVICE_PORT~~/${SERVICE_PORT:-9765}/g" /etc/nginx/nginx.conf.template
  cp /etc/nginx/nginx.conf.template /etc/nginx/nginx.conf
  nginx -g 'daemon off;'
else
  npm rebuild node-sass
  PORT=${SERVICE_PORT:-9765} npm start
fi
