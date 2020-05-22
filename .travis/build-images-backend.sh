#!/bin/bash
set -e
# kudos https://dev.to/zeerorg/build-multi-arch-docker-images-on-travis-5428

DIR=$(dirname $(realpath -s $0))

cd "${DIR}/../src/karmen_backend"

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USER" --password-stdin
docker info

DOCKER_PUBLISH_TAG="fragaria/karmen-backend:$TRAVIS_BRANCH"

# latest only if this is not a pre release
if [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then

DOCKER_PUBLISH_TAG="fragaria/karmen-backend:lastest"

fi

# Build for amd64 and push
docker buildx build --platform=linux/amd64,linux/arm/v7 \
            --push \
            --tag "$DOCKER_PUBLISH_TAG" \
            .


# Delete unnecessary tags
DOCKER_TOKEN=$(curl -s -H "Content-Type: application/json" -X POST -d '{"username": "'${DOCKER_USER}'", "password": "'${DOCKER_PASSWORD}'"}' https://hub.docker.com/v2/users/login/ | jq -r .token)

curl -i -X DELETE \
  -H "Accept: application/json" \
  -H "Authorization: JWT ${DOCKER_TOKEN}" \
  "https://hub.docker.com/v2/repositories/fragaria/karmen-backend/tags/${TRAVIS_BRANCH}-amd64/"

curl -i -X DELETE \
  -H "Accept: application/json" \
  -H "Authorization: JWT ${DOCKER_TOKEN}" \
  "https://hub.docker.com/v2/repositories/fragaria/karmen-backend/tags/${TRAVIS_BRANCH}-armhf/"

if [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then
  curl -i -X DELETE \
    -H "Accept: application/json" \
    -H "Authorization: JWT ${DOCKER_TOKEN}" \
    "https://hub.docker.com/v2/repositories/fragaria/karmen-backend/tags/latest-amd64/"

  curl -i -X DELETE \
    -H "Accept: application/json" \
    -H "Authorization: JWT ${DOCKER_TOKEN}" \
    "https://hub.docker.com/v2/repositories/fragaria/karmen-backend/tags/latest-armhf/"
fi
