#!/usr/bin/env bash

if [ "$SERVICE" = 'flask' ]; then
  if [ "$ENV" = 'production' ]; then
    service nginx start
    uwsgi --ini uwsgi.ini
  else
    export FLASK_APP=server
    export FLASK_DEBUG=true
    flask run --host=0.0.0.0 --port 8080
  fi
elif [ "$SERVICE" = 'celery-beat' ]; then
  export FLASK_APP=server
  export FLASK_DEBUG=true
  celery -A server.celery beat
elif [ "$SERVICE" = 'celery-worker' ]; then
  export FLASK_APP=server
  export FLASK_DEBUG=true
  celery -A server.celery worker
else
  exit 1
fi