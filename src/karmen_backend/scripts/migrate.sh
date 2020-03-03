#!/bin/bash

MYDIR="$(dirname "$(readlink -f "$0")")"

while ! pg_isready --port ${POSTGRES_PORT} --host ${POSTGRES_HOST} > /dev/null 2>&1; do echo 'Waiting for postgres...'; sleep 1; done
echo "Introducing pgmigrate structures if necessary..."
python3 "${MYDIR}/ensureschematable.py"
echo "Migrating db to the latest version..."


if [ "$ENV" = 'production' ]; then
  cat << EOF > "${MYDIR}/../db/migrations.yml"
callbacks:
  afterAll:
      - prod/users.sql
conn: "host='${POSTGRES_HOST}' port=${POSTGRES_PORT} dbname='${POSTGRES_DB}' user='${POSTGRES_USER}' password='${POSTGRES_PASSWORD}'"
EOF
elif [ "$ENV" = 'test' ]; then
    cat << EOF > "${MYDIR}/../db/migrations.yml"
callbacks:
  afterAll:
      - test/organizations.sql
      - test/printers.sql
      - test/users.sql
conn: "host='${POSTGRES_HOST}' port=${POSTGRES_PORT} dbname='${POSTGRES_DB}' user='${POSTGRES_USER}' password='${POSTGRES_PASSWORD}'"
EOF
else
  cat << EOF > "${MYDIR}/../db/migrations.yml"
callbacks:
  afterAll:
      - dev/organizations.sql
      - dev/printers.sql
      - dev/users.sql
conn: "host='${POSTGRES_HOST}' port=${POSTGRES_PORT} dbname='${POSTGRES_DB}' user='${POSTGRES_USER}' password='${POSTGRES_PASSWORD}'"
EOF
fi

pgmigrate -d ./db -t latest migrate

echo "Database migrated to the latest version..."