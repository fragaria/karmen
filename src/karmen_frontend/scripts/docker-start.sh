#!/bin/sh

DIR=$(dirname $(realpath -s $0))
cd $DIR

if [ "$ENV" = 'production' ]; then
  if [ -n ${BACKEND_BASE} ]; then
    cat << EOF > "../build/env.js"
window.env = {
  BACKEND_BASE: "${BACKEND_BASE}"
};
EOF
  fi

  SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
  SERVICE_PORT=${SERVICE_PORT:-9765}
  envsubst '$SERVICE_PORT $SERVICE_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
  nginx -g 'daemon off;'
else
  npm rebuild node-sass
  PORT=${SERVICE_PORT:-9765} npm start
fi
