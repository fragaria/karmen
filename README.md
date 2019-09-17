# Karmen - monitor and manage your 3D printers

[![Documentation Status](https://readthedocs.org/projects/karmen/badge/?version=latest)](https://karmen.readthedocs.io/en/latest/?badge=latest)
[![Build status](https://api.travis-ci.com/fragaria/karmen.svg?branch=master)](https://travis-ci.com/fragaria/karmen)

<p align="center">
  <img width="223" height="60" src="https://raw.githubusercontent.com/fragaria/karmen/master/web/src/logo.svg?sanitize=true">
</p>

**Karmen** aims to give its users a single place for monitoring
and managing multiple 3D printers. While existing solutions
such as [Octoprint](https://octoprint.org) excel in controlling
a single printer, there does not seem to be an open source platform
for a multi-printer setup or even a large scale printer farm.

Our solution is a perfect fit for a shared makerspace, small batch
part factory or a public school that offers multiple printers to various
users.

<TODO screenshot>

## Contributing and support

If you would like to take part in this project, hit us up on karmen@fragaria.cz
or leave us a note on [Gitter](https://gitter.im/fragaria/karmen). You can read
more in our [contributing rules](./CONTRIBUTING.md).

If you are interested in a more in-depth documentation, go visit our [docsite](https://karmen.readthedocs.io).

## Usage

The easiest way to run the whole system is via [docker compose](https://docs.docker.com/compose/).
The whole system is designed to be run on a reasonably powerful standalone microcomputer such as Raspberry Pi 4
which is connected to the same network as the printers.

```sh
$ git clone git@github.com:fragaria/karmen.git && cd karmen/ # get the repo
$ cp ./src/karmen_backend/config.prod.cfg ./config.local.cfg # create a local configuration and change at least the SECRET_KEY
$ BASE_HOST=random-ip-address docker-compose -f docker-compose.prod.yml up --abort-on-container-exit # start the containers
# GO VISIT http://localhost/ or http://random-ip-address from the network
```

`BASE_HOST` is an address or hostname of the machine where this whole thing works and is used to access the Python backend.
You will also use it to access the Javascript frontend from your browser. The most important step is the configuration
which happens within `config.local.cfg` file. Read the comments in the original `config.prod.cfg` to make sure that you
know what are you doing.

## Development

While it is possible to run both the Python backend and Javascript frontend as standalone projects,
the most comfortable way is again with docker compose.

```sh
$ git clone git@github.com:fragaria/karmen.git && cd karmen/ # get the repo
$ cp ./src/karmen_backend/config.prod.cfg ./config.local.cfg # create a local configuration and change at least the SECRET_KEY
$ docker-compose -f docker-compose.dev.yml up --build --abort-on-container-exit
# GO VISIT http://localhost:3000/
```

Within this setup, live reload for both backend and frontend is active, with a notable exception
of `celery` containers. They don't support live reload debug mode out of the box. You can load new code
into celery by rebiulding and restarting the appropriate containers.

Also, the network autodiscovery via ARP does not work at all in the dev mode. The mDNS resolution
also does not work in the dev mode due to the networking configuration.

On the other hand, two fake virtual printers are automatically added to your envirnoment, so you have a few
things to play with.

**Note**: If something suddenly breaks within this setup, try to clean docker with `docker system prune`, it might help.

## License

All of the code herein is copyright 2019 [Fragaria s.r.o.](https://fragaria.cz) and released
under the terms of the [GNU Affero General Public License, version 3](./LICENSE.txt).
