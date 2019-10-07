#!/bin/bash

# TODO this is different in prod, move to ENVVARS
while ! pg_isready --port 5432 --host postgres > /dev/null 2>&1; do echo 'Waiting for postgres...'; sleep 1; done
echo "Migrating db"
pgmigrate -d ./db -t latest migrate