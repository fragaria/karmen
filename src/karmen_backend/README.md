[![Build status](https://api.travis-ci.com/fragaria/karmen.svg?branch=master)](https://travis-ci.com/fragaria/karmen)
[![Coverage Status](https://coveralls.io/repos/github/fragaria/karmen/badge.svg?branch=master)](https://coveralls.io/github/fragaria/karmen?branch=master)

# Development

The preferred way is to use the composed docker package as [described in here](https://github.com/fragaria/karmen/blob/master/README.md).
You don't have to bother with setup of database and other services.

## Docker

You might need to adjust values in `config.dev.cfg` to properly connect to Redis and Postgresql.

```sh
docker build -t karmen/backend .
docker run -e ENV=develop -e SERVICE=flask -e FLASKR_SETTINGS='../config.dev.cfg' -p5000:8080 karmen/backend
docker run -e ENV=develop -e SERVICE=celery-worker FLASKR_SETTINGS='../config.dev.cfg' karmen/backend
docker run -e ENV=develop -e SERVICE=celery-beat FLASKR_SETTINGS='../config.dev.cfg' karmen/backend
```

**Culprits**

- The `celery` services are necessary for regular checks of the state of connected printers and for network discovery.
If you don't mind that the connection state might be off for some time, you are fine without them.
- Octoprint and other services are using [Multicast DNS](https://en.wikipedia.org/wiki/Multicast_DNS) for
service autodiscovery. This works only when docker containers are run as `privileged` and when host's `/var/run/dbus`
is mapped as a volume into the container. This is used in `flask` and `celery-worker` service.
- The network autodiscovery service is off by default. It is using [ARP queries](https://en.wikipedia.org/wiki/Address_Resolution_Protocol)
which don't work out of the box in a docker container. To make it work, the container has to run in a `host` network mode
which affects how it is connected to the other containers.

## Manual mode

- Install `pipenv` and make its binary accessible on your PATH
- Install `arp-scan` (for printer discovery), `avahi-utils` (for bonjour hostname autodiscovery), `libpq-dev` (for psycopg2 build)
- Setup pgsql database `print3d` and import schema from `db/schema.sql`
- Setup redis instance
- Jump into pipenv's virtualenv by running `pipenv install && pipenv shell`
- Configure `flask` with `export FLASK_APP=server`
- Optionally enable debug mode with `export FLASK_DEBUG=true`
- Point `flask` to proper configuration with `export FLASKR_SETTINGS=../config.dev.cfg`
- `flask run` and the server will start to accept connections on `http://localhost:5000`
- Visit `localhost:5000`
