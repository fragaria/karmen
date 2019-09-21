#!/bin/sh
if [ "$ENV" = 'production' ]; then
  npm run build-env-file
  nginx -g 'daemon off;'
else
  npm rebuild node-sass
  PORT=8080 npm start
fi
