#!/usr/bin/env sh

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
elif [ "$SERVICE" = 'fake-printer' ]; then
  export FLASK_APP=fakeprinter
  export FLASK_DEBUG=true
  flask run --host=0.0.0.0 --port 8080
else
  echo "Unknown service ${SERVICE} encountered. I know of [flask, celery-beat and celery-worker, fake-printer]".
  exit 1
fi