[![Build status](https://api.travis-ci.com/fragaria/karmen.svg?branch=master)](https://travis-ci.com/fragaria/karmen)
[![Coverage Status](https://coveralls.io/repos/github/fragaria/karmen/badge.svg?branch=master)](https://coveralls.io/github/fragaria/karmen?branch=master)

# How to run this

- Install `pipenv` and make its binary accessible on your PATH
- Install `arp-scan` (for printer discovery), `avahi-utils` (for bonjour hostname autodiscovery), `libpq-dev` (for psycopg2 build)
- Setup pgsql database `print3d` and import schema from `db/schema.sql`
- For details, see the attached [Makefile](Makefile)

**This backend automatically scans the network for attached printers. This might be problematic in larger networks.**

```sh
# clone repo and cd into karmen_backend directory
$ make install # install python dependencies
$ make redis # run a dockerized redis on 6379
$ make test # run tests
$ make start-dev # run celery beat, celery worker and flask app all at the same time
$ make stop-dev # kills all processes started with start-dev
```

Visit `localhost:5000`.

# Notes

1. Configure `flask` with `export FLASK_APP=server`
1. Optionally enable debug mode with `export FLASK_DEBUG=true`
1. Point `flask` to proper configuration with `export FLASKR_SETTINGS=../config.local.cfg`
1. `flask run` and the server will start to accept connections on `http://localhost:5000`

- How to create postgresDB: (https://serverfault.com/a/110155)

# Docker

```sh
docker build -t karmen/backend .
docker run -e FLASKR_SETTINGS='../config.local.cfg' -p5000:80 karmen/backend
```