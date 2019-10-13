#!/bin/bash

MYDIR="$(dirname "$(readlink -f "$0")")"

while ! pg_isready --port ${POSTGRES_PORT} --host ${POSTGRES_HOST} > /dev/null 2>&1; do echo 'Waiting for postgres...'; sleep 1; done
echo "Introducing pgmigrate structures if necessary..."
python3 "${MYDIR}/ensureschematable.py"
echo "Migrating db to the latest version..."


if [ "$ENV" = 'production' ]; then
  cat << EOF > "${MYDIR}/../db/migrations.yml"
conn: "host='${POSTGRES_HOST}' port=${POSTGRES_PORT} dbname='print3d' user='print3d' password='print3d'"
EOF
else
  cat << EOF > "${MYDIR}/../db/migrations.yml"
callbacks:
  afterAll:
      - fake-printers.sql
conn: "host='${POSTGRES_HOST}' port=${POSTGRES_PORT} dbname='print3d' user='print3d' password='print3d'"
EOF
fi

pgmigrate -d ./db -t latest migrate

echo "Database migrated to the latest version..."