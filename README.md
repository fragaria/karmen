# Karmen

[![Documentation Status](https://readthedocs.org/projects/karmen/badge/?version=latest)](https://karmen.readthedocs.io/en/latest/?badge=latest)
[![Build status](https://api.travis-ci.com/fragaria/karmen.svg?branch=master)](https://travis-ci.com/fragaria/karmen)

A common interface for multiple 3d printers.

## Description

This project contains

- [Backend service](./src/karmen_backend) that discovers and communicates with all the connected printers
- [Frontend](./src/karmen_frontend) that displays data from the backend

## Prerequisites

- Docker

## Installation

## Development

For development with live reload (both backend and frontend), start this with the
following docker-compose command. The dev mode also contains two fake printers.

The network autodiscovery via ARP does not work in the dev mode. The mDNS resolution
also does not work in the dev mode due to the networking configuration.

```sh
REACT_APP_GIT_REV=`git rev-parse --short HEAD` docker-compose -f docker-compose.dev.yml up
```

## Usage

```sh
REACT_APP_GIT_REV=`git rev-parse --short HEAD` BASE_HOST=10.192.202.58 docker-compose -f docker-compose.prod.yml up
```

## Contributing

## Support

## License

All of the code herein is copyright 2019 [Fragaria s.r.o.](https://fragaria.cz) and released under the terms of the [GNU Affero General Public License, version 3](./LICENSE.txt).
