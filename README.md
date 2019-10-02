<p align="center">
  <img width="223" height="60" src="https://raw.githubusercontent.com/fragaria/karmen/master/web/src/logo.svg?sanitize=true">
</p>

# Karmen - monitor and manage your 3D printers

[![Documentation Status](https://readthedocs.org/projects/karmen/badge/?version=latest)](https://karmen.readthedocs.io/en/latest/?badge=latest)
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

<TODO screenshot>

## Contributing and support

If you would like to take part in this project, hit us up on karmen@fragaria.cz
or leave us a note on [Gitter](https://gitter.im/fragaria/karmen). You can read
more in our [contributing rules](./CONTRIBUTING.md).

If you are interested in a more in-depth documentation, go visit our [docsite](https://karmen.readthedocs.io).

## Installation and usage

Check our [documentation](https://karmen.readthedocs.io/en/latest/installation.html) for up to date instructions.

## Development

While it is possible to run both the Python backend and Javascript frontend as standalone projects,
the most comfortable way is again with docker compose.

```sh
$ git clone git@github.com:fragaria/karmen.git && cd karmen/ # get the repo
$ docker-compose up --build
# GO VISIT http://localhost:3000/
```

The network autodiscovery via ARP does not work at all in the dev mode. The mDNS resolution
also does not work in the dev mode due to the networking configuration. (You can enable these two
features by altering the network settings of the containers, check [`docker-compose.release.yml`](./docker-compose.release.yml) for inspiration).

On the other hand, two fake virtual printers are automatically added to your envirnoment, so you have a few
things to play with.

**Note**: If something suddenly breaks within this setup, try to clean docker with `docker system prune`, it might help.

## Versioning and releases

If you are making a new release, you need to tag this repository and Travis does the rest. You also
want to bump the version numbers in the appropriate places in source code, such as `package.json`, Python
modules etc. That's exactly what the `make-version.py` script does. So the release procedure would be:

```sh
$ VERSION=1.2.3
$ python make-version.py $VERSION
$ git add src docs && git commit -m "Version $VERSION" && git tag $VERSION
```

## License

All of the code herein is copyright 2019 [Fragaria s.r.o.](https://fragaria.cz) and released
under the terms of the [GNU Affero General Public License, version 3](./LICENSE.txt).
