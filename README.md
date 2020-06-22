<p align="center">
  <img width="223" height="60" src="https://raw.githubusercontent.com/fragaria/karmen/e2982bbfb7591a5e322f2e094505d75f7036e0ca/web/src/logo.svg?sanitize=true">
</p>

# Karmen - monitor and manage your 3D printers

[![Build status](https://api.travis-ci.com/fragaria/karmen.svg?branch=master)](https://travis-ci.com/fragaria/karmen)
[![Gitter chat](https://badges.gitter.im/fragaria/karmen.png)](https://gitter.im/fragaria/karmen)


**Karmen** aims to give its users a single place for monitoring
and managing multiple 3D printers. While existing solutions
such as [Octoprint](https://octoprint.org) excel in controlling
a single printer, there does not seem to be an open source platform
for a multi-printer setup or even a large scale printer farm.

Our solution is a perfect fit for a shared makerspace, small batch
part factory or a public school that offers multiple printers to various
users.

## Contributing and support

If you would like to take part in this project, hit us up on karmen@fragaria.cz
or leave us a note on [Gitter](https://gitter.im/fragaria/karmen). You can read
more in our [contributing rules](./CONTRIBUTING.md).

If you are interested in a more in-depth documentation, go visit our [docsite](https://docs.karmen.tech).

## Installation and usage

Check our [documentation](https://docs.karmen.tech/#/on-premise) for up to date instructions.

## Development

While it is possible to run all of the components as standalone projects,
the most comfortable way is with docker compose.

```sh
$ git clone git@github.com:fragaria/karmen.git && cd karmen/ # get the repo
$ docker-compose up --build
# GO VISIT http://localhost:4000/
```

If you want to connect to an internals of a service run `docker-compose exec
<service> <command>` from root of project. Where `<service>` is the name os the service as defined
in `docker-compose.yml`.

Examples:

- to connect to postgres: `docker-compose exec postgres psql -U print3d print3d` (with the default configuration).
- to connect to running backend: `docker-compose exec backend bash`


There are two modes available. They differ in the way the printers are connected to Karmen Hub.

1. **Cloud Mode**
    This mode is used when Karmen Hub is run as a service on the internet. The printers are connected
    via [websocket proxy](https://github.com/fragaria/websocket-proxy) that is tunnelling the network connection
    to Octoprint or other compatible API. In this mode, the autodiscovery feature is disabled. This is
    the default mode.

1. **Local Mode**
    This can be used when Karmen Hub is run on premise with access to printers via local network.
    In this mode, you can add printers by running the autodiscovery task. Set
    `CLOUD_MODE=0` in `loca.env` file to switch to this mode.

The network autodiscovery via ARP does not work at all in the dev mode.

On the other hand, three fake virtual printers are automatically added to your envirnoment, so you have a few
things to play with.

Also, there are at least two users available in the fresh dev environment:

- `test-admin` (password *admin-password*) - An Administrator that can do everything, for example add more users.
- `test-user` (password *user-password*) - A user with restricted permissions. She cannot manage other users and
printers.

All of the g-codes are currently shared across all user accounts in an organization.

To change a configuration edit [local.env](./local.env) file and follow instructions.

**Note**: If something suddenly breaks within this setup, try to clean docker
with `docker system prune` or delete `tmp/db-data` and `tmp/karmen-files` it
might help.

## Backend API Specification

Backend API is described in 
[./src/karmen_backend/openapi/swagger.yaml](./src/karmen_backend/openapi/swagger.yaml).
Here you can find the [API specification in
Redocly](http://redocly.github.io/redoc/?url=https://cloud.karmen.tech/api/openapi-spec.yaml).


## Versioning and releases

If you are making a new release, you need to tag this repository and Travis does the rest. You also
want to bump the version numbers in the appropriate places in source code, such as `package.json`, Python
modules etc. That's exactly what the `make-version/make-version.py` script does. So the release procedure would be:

```sh
$ VERSION=1.2.3  # without 'v'
$ python3 make-version/make-version.py "${VERSION}"
$ git add src/ docs/ && git commit -m "Version $VERSION" && git tag "v${VERSION}"  # notice the tag version string has 'v' prefix
```

If the VERSION variable contains a `-` (e. g. `1.2.3-rc.1`), it is considered as a prerelease.

## License

All of the code herein is copyright 2020 [Fragaria s.r.o.](https://fragaria.cz) and released
under the terms of the [GNU Affero General Public License, version 3](./LICENSE.txt).
