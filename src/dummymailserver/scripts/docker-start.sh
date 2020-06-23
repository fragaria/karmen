#!/bin/sh

export FLASK_APP=dummymailserver
export FLASK_DEBUG=true
flask run --host=$SERVICE_HOST --port $SERVICE_PORT
