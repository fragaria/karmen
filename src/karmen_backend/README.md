# Karmen backend

[![Build status](https://api.travis-ci.com/fragaria/karmen.svg?branch=master)](https://travis-ci.com/fragaria/karmen)
[![Coverage Status](https://coveralls.io/repos/github/fragaria/karmen/badge.svg?branch=master)](https://coveralls.io/github/fragaria/karmen?branch=master)

Python based REST API backend for Karmen.

## Development

The preferred way is to use the composed docker package as [described in here](../../README.md).
You don't have to bother with setup of database and other services.

### Docker

You might need to adjust values in `config.dev.cfg` to properly connect to Redis and PostgreSQL. Don't
forget to setup the database with migrations from `db/migrations/`. You can run `scripts/migrate.sh`
with properly set `POSTGRES_HOST`, `POSTGRES_PORT` and `ENV` environment variables for that.

```sh
docker build -t fragaria/karmen-backend .
docker run -e ENV=develop -e SERVICE=flask -e FLASKR_SETTINGS='../config.dev.cfg' -p5000:9764 fragaria/karmen-backend
docker run -e ENV=develop -e SERVICE=celery-worker FLASKR_SETTINGS='../config.dev.cfg' fragaria/karmen-backend
docker run -e ENV=develop -e SERVICE=celery-beat FLASKR_SETTINGS='../config.dev.cfg' fragaria/karmen-backend
```

You can control the exposed interface and port with the following environment variables. This is useful when container is
run in the docker's networking host mode.

- `SERVICE_HOST` - Interface on which the proxy will be exposed, defaults to `0.0.0.0`. 
- `SERVICE_PORT` - Port on which the proxy will be exposed, defaults to `9766`


**Culprits**

- The `celery-*` services are necessary for regular checks of the state of connected printers and for network discovery.
If you don't mind that the connection state might be off for some time, you are fine without them.
- Octoprint and other services are using [Multicast DNS](https://en.wikipedia.org/wiki/Multicast_DNS) for
service autodiscovery. This works only when docker containers are run as `privileged` and when host's `/var/run/dbus`
is mapped as a volume into the container. This feature is called from `flask` and `celery-worker` services. This might
not work on Windows, Android and other operating systems.
- The network autodiscovery service is off by default. It is using [ARP queries](https://en.wikipedia.org/wiki/Address_Resolution_Protocol)
which don't work out of the box in a docker container. To make ARP work, the container has to run in a `host` network mode
which affects how it is connected to the other containers (database, redis).

### Manual mode

- Install `pipenv` and make its binary accessible on your PATH
- Install `arp-scan` (for printer discovery), `avahi-utils` (for bonjour hostname autodiscovery), `libpq-dev` (for psycopg2 build)
- Setup redis instance
- Jump into pipenv's virtualenv by running `pipenv install --dev && pipenv shell`
- Setup pgsql database and hydrate it by running `scripts/migrate.sh` with properly set `POSTGRES_HOST`, `POSTGRES_PORT` and `ENV` environment variables
- Configure `flask` with `export FLASK_APP=server`
- Optionally enable debug mode with `export FLASK_DEBUG=true`
- Point `flask` to proper configuration with `export FLASKR_SETTINGS=../config.dev.cfg`
- `flask run` and the server will start to accept connections on `http://localhost:5000`
- Visit `localhost:5000`

## User access model

- `users` - A list of users in the system. Every user has potentially multiple *providers*. These
are identity providers, such as OAuth services, SAML services. Currently, only a **local** provider is
available. They are identified by `UUIDv4`.
- `local_users` - Users from the **local** provider. They have a `bcrypt`-ed password stored in the
database.
- There are two roles at the moment: *user* and *admin*.
- Admins can create new users. Every new user gets a password set by admin. But the password is marked
to be changed and no interesting endpoints are available for users that are required to change their password.
- Local users exchange their username and password for a pair `JWT` tokens. An `access_token` is used
to access the API, a `refresh_token` is used to get a new access token. Access tokens expire in 15 minutes.
Refresh tokens expire in 30 days.
- An access token issued after login is marked as *fresh*. Access tokens issued against the refresh
token are marked as *nonfresh*. Sensitive operations (such as password changes and all admin endpoints) require *fresh* tokens.
Thus forcing the user to send the username/password pair again. A special endpoint should be used for that
to prevent issuing unnecessary refresh tokens.
- User accounts can be suspended by admins. Whole API is then rendered inaccessible for them.
- Every user can have multiple **API tokens**. These are *always nonfresh, in a `user` role and do not expire.*
If you need to get rid of them, revoke them in the application.

Also, there are at least two users available in the fresh dev environment:

- `test-admin` (password *admin-password*) - An Administrator that can do everything, for example add more users.
- `test-user` (password *user-password*) - A user with restricted permissions. She cannot manage other users and
printers.

In the production mode, there is a default admin user named `karmen` with password `karmen3D` that has to be changed
upon first login. Make sure that you do this right after the installation.
