#!/bin/sh
SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
SERVICE_PORT=${SERVICE_PORT:-9766}
envsubst '$SERVICE_HOST $SERVICE_PORT $BACKEND_HOST $BACKEND_PORT $FRONTEND_HOST $FRONTEND_PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
nginx -g "daemon off;"
