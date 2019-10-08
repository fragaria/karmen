#!/bin/bash

MYDIR="$(dirname "$(readlink -f "$0")")"

while ! pg_isready --port ${POSTGRES_PORT} --host ${POSTGRES_HOST} > /dev/null 2>&1; do echo 'Waiting for postgres...'; sleep 1; done
echo "Introducing pgmigrate structures if necessary..."
python3 "${MYDIR}/ensureschematable.py"
echo "Migrating db to the latest version..."
pgmigrate -d ./db -t latest migrate
