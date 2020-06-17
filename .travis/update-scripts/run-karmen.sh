#!/bin/bash
set -eo errtrace
set -o pipefail

## Make sure that we are doing this in the right context
PARENT_PATH=$( cd $(dirname $(readlink -f "$0")) ; pwd -P )
cd "$PARENT_PATH"

docker-compose up -d
