#!/bin/bash

export FLASK_APP=fakeprinter
export FLASK_DEBUG=true
flask run --host=${SERVICE_HOST:-0.0.0.0} --port ${SERVICE_PORT:-8080}
