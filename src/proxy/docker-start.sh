#!/bin/sh
SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
SERVICE_PORT=${SERVICE_PORT:-9766}
IS_DEV_ENV=${IS_DEV_ENV}

mkdir -p /etc/nginx/includes

if [ "$IS_DEV_ENV" = 1 ]

then
  for configFile in /etc/nginx/includes-dev/*.conf.template; do
    newFile="/etc/nginx/includes/$(basename "${configFile%.template}")"
    envsubst '$SERVICE_HOST $SERVICE_PORT $BACKEND_HOST $BACKEND_PORT $FRONTEND_HOST $FRONTEND_PORT $APIDOC_HOST $APIDOC_PORT' < "$configFile" > "$newFile"
  done
fi

envsubst '$SERVICE_HOST $SERVICE_PORT $BACKEND_HOST $BACKEND_PORT $FRONTEND_HOST $FRONTEND_PORT $APIDOC_HOST $APIDOC_PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
nginx -g "daemon off;"
