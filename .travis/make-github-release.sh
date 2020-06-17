#!/bin/bash

set -eo errtrace
set -o pipefail

cd `dirname $0`


./../make-version/check-version.sh --ignore-missing-tag|| exit 1

DEST="karmen"

# Create release bundle
rm -r "$DEST" 2> /dev/null
mkdir -p "${DEST}"
cp ../README.md "${DEST}"
cp ../docker-compose.release.yml "${DEST}/docker-compose.yml"
echo "${TRAVIS_BRANCH-latest}" > "${DEST}/VERSION"

# Hardcode version into docker-compose
sed -i "s/fragaria\/karmen-frontend/fragaria\/karmen-frontend:${TRAVIS_BRANCH-latest}/g" "${DEST}/docker-compose.yml"
sed -i "s/fragaria\/karmen-backend/fragaria\/karmen-backend:${TRAVIS_BRANCH-latest}/g" "${DEST}/docker-compose.yml"
sed -i "s/fragaria\/karmen-proxy/fragaria\/karmen-proxy:${TRAVIS_BRANCH-latest}/g" "${DEST}/docker-compose.yml"


for file in run-karmen.sh stop-karmen.sh update.sh; do
  cp .travis/update-scripts/$file "${DEST}/$file"
  chmod +x "${DEST}/$file"
done


zip -r release.zip "$DEST"
