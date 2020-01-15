#!/bin/bash

MYDIR="$(dirname "$(readlink -f "$0")")"

test_flaskr_settings() {
  if [ -z "$FLASKR_SETTINGS" ]; then
    echo "FLASKR_SETTINGS environment variable is required"
    exit 1
  fi

  if [ ! -f "$MYDIR/$FLASKR_SETTINGS" ]; then
    echo "File on ${MYDIR}/${FLASKR_SETTINGS} does not exist"
    exit 1
  fi
}

clean_pid_file() {
  pidpath=$1
  if [ -f $pidpath ]; then
    kill `cat ${pidpath}` 2> /dev/null
    rm -f $pidpath
  fi
}

if [ "$SERVICE" = 'flask' ]; then
  test_flaskr_settings
  if [ "$ENV" = 'production' ]; then
    SERVICE_PORT=${SERVICE_PORT:-9764}
    SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
    envsubst '$SERVICE_PORT $SERVICE_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
    for UWSGIPID in {1..4}; do
      sed -e "s|socket = /tmp/uwsgi.sock|socket = /tmp/uwsgi${UWSGIPID}.sock|g" "/etc/uwsgi/uwsgi.ini.template" > "/etc/uwsgi/uwsgi${UWSGIPID}.ini"
    done
    
    /usr/local/bin/supervisord
  else
    export FLASK_APP=server
    export FLASK_DEBUG=true
    flask run --host=${SERVICE_HOST:-0.0.0.0} --port ${SERVICE_PORT:-9764}
  fi
elif [ "$SERVICE" = 'celery-beat' ]; then
  test_flaskr_settings
  clean_pid_file /tmp/celerybeatd.pid
  if [ "$ENV" = 'production' ]; then
    celery -A server.celery beat --pidfile=/tmp/celerybeatd.pid -s /tmp/celerybeat-schedule
  else
    export FLASK_DEBUG=true
    watchmedo auto-restart --recursive -- celery -A server.celery beat --pidfile=/tmp/celerybeatd.pid -s /tmp/celerybeat-schedule
  fi
elif [ "$SERVICE" = 'celery-worker' ]; then
  test_flaskr_settings
  clean_pid_file /tmp/celeryworkerd.pid
  if [ "$ENV" = 'production' ]; then
    celery -A server.celery worker --pidfile=/tmp/celeryworkerd.pid
  else
    export FLASK_DEBUG=true
    watchmedo auto-restart --recursive -- celery -A server.celery worker --pidfile=/tmp/celeryworkerd.pid
  fi
else
  echo "Unknown service ${SERVICE} encountered. I know of [flask, celery-beat and celery-worker]"
  exit 1
fi
