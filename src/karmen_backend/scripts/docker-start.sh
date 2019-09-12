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
fi

