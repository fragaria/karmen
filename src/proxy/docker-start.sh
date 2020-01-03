#!/bin/sh
SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
SERVICE_PORT=${SERVICE_PORT:-9766}
envsubst '$SERVICE_HOST $SERVICE_PORT $BACKEND_HOST $BACKEND_PORT $FRONTEND_HOST $FRONTEND_PORT' < /usr/local/openresty/nginx/conf/nginx.conf.template > /usr/local/openresty/nginx/conf/nginx.conf
openresty -g "daemon off;"
