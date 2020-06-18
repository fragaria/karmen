#!/bin/bash

err() {
  echo "ERROR: $@" >&2
}

trap 'exit_code=$?; err "Exiting on error $exit_code"; exit $exit_code' ERR
set -o errtrace # print traceback on error
set -o pipefail  # exit on error in pipe


echo "Starting backend service $SERVICE in mode '$ENV'"

MYDIR="$(cd `dirname "$0"` && pwd; cd - > /dev/null)"

clean_pid_file() {
  pidpath=$1
  if [ -f $pidpath ]; then
    kill `cat ${pidpath}` || err "Could not kill the process `cat ${pidpath}`, the process does not exist probably."
    rm -f $pidpath
  fi
}

start_dbus() {
  mkdir -p /var/run/dbus
  # clean_pid_file /var/run/dbus/pid
  if [ ! -f /var/run/dbus/pid ]; then
    /usr/bin/dbus-daemon --config-file=/usr/share/dbus-1/system.conf --print-address
  fi
}

if [ "$SERVICE" = 'flask' ]; then
  start_dbus || err "could not start dbus"
  # FIXME: this should start for CLOUD_MODE=0 only
  /usr/sbin/avahi-daemon -D || err "could not start avahi-daemon"
  /usr/sbin/avahi-dnsconfd -D || err "could not start dnsconf"
  if [ "$ENV" = 'production' ]; then
    SERVICE_PORT=${SERVICE_PORT:-9764}
    SERVICE_HOST=${SERVICE_HOST:-0.0.0.0}
    envsubst '$SERVICE_PORT $SERVICE_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
    /usr/local/bin/supervisord
  else
    export FLASK_APP=server
    export FLASK_DEBUG=true
    flask run --host=${SERVICE_HOST:-0.0.0.0} --port ${SERVICE_PORT:-9764}
  fi
elif [ "$SERVICE" = 'celery-beat' ]; then
  clean_pid_file /tmp/celerybeatd.pid
  if [ "$ENV" = 'production' ]; then
    celery -A server.celery beat --pidfile=/tmp/celerybeatd.pid -s /tmp/celerybeat-schedule
  else
    export FLASK_DEBUG=true
    watchmedo auto-restart --recursive -- celery -A server.celery beat --pidfile=/tmp/celerybeatd.pid -s /tmp/celerybeat-schedule
  fi
elif [ "$SERVICE" = 'celery-worker' ]; then
  clean_pid_file /tmp/celeryworkerd.pid
  start_dbus || err "could not start dbus"
  /usr/sbin/avahi-daemon -D || err "could not start avahi-daemon"
  /usr/sbin/avahi-dnsconfd -D || err "could not start dnsconf"
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

echo "Starting backend service $SERVICE in mode '$ENV'"
