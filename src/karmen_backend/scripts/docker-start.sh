#!/usr/bin/env sh

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
    rm $pidpath
  fi
}

if [ "$SERVICE" = 'flask' ]; then
  test_flaskr_settings
  if [ "$ENV" = 'production' ]; then
    service nginx start
    uwsgi --ini uwsgi.ini
  else
    export FLASK_APP=server
    export FLASK_DEBUG=true
    flask run --host=0.0.0.0 --port 8080
  fi
elif [ "$SERVICE" = 'celery-beat' ]; then
  test_flaskr_settings
  export FLASK_APP=server
  export FLASK_DEBUG=true
  clean_pid_file /opt/celerybeatd.pid
  celery -A server.celery beat --pidfile=/opt/celerybeatd.pid
elif [ "$SERVICE" = 'celery-worker' ]; then
  test_flaskr_settings
  export FLASK_APP=server
  export FLASK_DEBUG=true
  clean_pid_file /opt/celeryworkerd.pid
  celery -A server.celery worker --pidfile=/opt/celeryworkerd.pid
elif [ "$SERVICE" = 'fake-printer' ]; then
  export FLASK_APP=fakeprinter
  export FLASK_DEBUG=true
  flask run --host=0.0.0.0 --port 8080
else
  echo "Unknown service ${SERVICE} encountered. I know of [flask, celery-beat and celery-worker, fake-printer]"
  exit 1
fi