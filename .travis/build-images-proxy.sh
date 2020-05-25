#!/bin/bash
set -e

# kudos https://dev.to/zeerorg/build-multi-arch-docker-images-on-travis-5428

DIR=$(dirname $(realpath -s $0))

cd "${DIR}/../src/proxy"

export DOCKER_CLI_EXPERIMENTAL=enabled


echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USER" --password-stdin
docker info

echo buildng for $TRAVIS_BRANCH $TRAVIS_TAG

DOCKER_PUBLISH_TAG="fragaria/karmen-proxy:$TRAVIS_BRANCH"

# latest only if this is not a pre release
if [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then

DOCKER_PUBLISH_TAG="fragaria/karmen-proxy:lastest"

fi

# Build for amd64 and push
docker buildx build --platform=linux/amd64,linux/arm/v7 \
            --push \
            --tag "$DOCKER_PUBLISH_TAG" \
            .






# latest only if not rc
if [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then
  docker pull fragaria/karmen-proxy:$TRAVIS_BRANCH
  docker pull fragaria/karmen-proxy:$TRAVIS_BRANCH-amd64
  docker pull fragaria/karmen-proxy:$TRAVIS_BRANCH-armhf
  docker tag fragaria/karmen-proxy:$TRAVIS_BRANCH fragaria/karmen-proxy:latest
  docker tag fragaria/karmen-proxy:$TRAVIS_BRANCH-amd64 fragaria/karmen-proxy:latest-amd64
  docker tag fragaria/karmen-proxy:$TRAVIS_BRANCH-armhf fragaria/karmen-proxy:latest-armhf
  docker push fragaria/karmen-proxy:latest
  docker push fragaria/karmen-proxy:latest-armhf
  docker push fragaria/karmen-proxy:latest-amd64

  docker manifest create fragaria/karmen-proxy:latest \
              fragaria/karmen-proxy:latest-amd64 \
              fragaria/karmen-proxy:latest-armhf

  docker manifest annotate fragaria/karmen-proxy:latest fragaria/karmen-proxy:latest-armhf --arch arm
  docker manifest annotate fragaria/karmen-proxy:latest fragaria/karmen-proxy:latest-amd64 --arch amd64

  docker manifest push fragaria/karmen-proxy:latest
fi

exit 0

# Delete unnecessary tags
DOCKER_TOKEN=$(curl -s -H "Content-Type: application/json" -X POST -d '{"username": "'${DOCKER_USER}'", "password": "'${DOCKER_PASSWORD}'"}' https://hub.docker.com/v2/users/login/ | jq -r .token)

curl -i -X DELETE \
  -H "Accept: application/json" \
  -H "Authorization: JWT ${DOCKER_TOKEN}" \
  "https://hub.docker.com/v2/repositories/fragaria/karmen-proxy/tags/${TRAVIS_BRANCH}-amd64/"

curl -i -X DELETE \
  -H "Accept: application/json" \
  -H "Authorization: JWT ${DOCKER_TOKEN}" \
  "https://hub.docker.com/v2/repositories/fragaria/karmen-proxy/tags/${TRAVIS_BRANCH}-armhf/"

if [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then
  curl -i -X DELETE \
    -H "Accept: application/json" \
    -H "Authorization: JWT ${DOCKER_TOKEN}" \
    "https://hub.docker.com/v2/repositories/fragaria/karmen-proxy/tags/latest-amd64/"

  curl -i -X DELETE \
    -H "Accept: application/json" \
    -H "Authorization: JWT ${DOCKER_TOKEN}" \
    "https://hub.docker.com/v2/repositories/fragaria/karmen-proxy/tags/latest-armhf/"
fi
