#!/bin/bash
set -e
set -v

# kudos https://dev.to/zeerorg/build-multi-arch-docker-images-on-travis-5428

DIR=$(dirname $(realpath -s $0))

cd "${DIR}/../src/karmen_backend"

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USER" --password-stdin
docker info

export DOCKER_CLI_EXPERIMENTAL=enabled


# Create manifest list and push that

# for bot architecture with major release
if [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then
  docker manifest create fragaria/karmen-backend:$TRAVIS_BRANCH \
              fragaria/karmen-backend:$TRAVIS_BRANCH-amd64 \
              fragaria/karmen-backend:$TRAVIS_BRANCH-armhf

  docker manifest annotate fragaria/karmen-backend:$TRAVIS_BRANCH fragaria/karmen-backend:$TRAVIS_BRANCH-armhf --arch arm
  docker manifest annotate fragaria/karmen-backend:$TRAVIS_BRANCH fragaria/karmen-backend:$TRAVIS_BRANCH-amd64 --arch amd64

  docker manifest push fragaria/karmen-backend:$TRAVIS_BRANCH

# otherwise just amd64
else
  docker manifest create fragaria/karmen-backend:$TRAVIS_BRANCH \
              fragaria/karmen-backend:$TRAVIS_BRANCH-amd64 \

  docker manifest annotate fragaria/karmen-backend:$TRAVIS_BRANCH fragaria/karmen-backend:$TRAVIS_BRANCH-amd64 --arch amd64

  docker manifest push fragaria/karmen-backend:$TRAVIS_BRANCH

fi
# latest only if not rc
if [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then
  docker pull fragaria/karmen-backend:$TRAVIS_BRANCH
  docker pull fragaria/karmen-backend:$TRAVIS_BRANCH-amd64
  docker pull fragaria/karmen-backend:$TRAVIS_BRANCH-armhf
  docker tag fragaria/karmen-backend:$TRAVIS_BRANCH fragaria/karmen-backend:latest
  docker tag fragaria/karmen-backend:$TRAVIS_BRANCH-amd64 fragaria/karmen-backend:latest-amd64
  docker tag fragaria/karmen-backend:$TRAVIS_BRANCH-armhf fragaria/karmen-backend:latest-armhf
  docker push fragaria/karmen-backend:latest
  docker push fragaria/karmen-backend:latest-armhf
  docker push fragaria/karmen-backend:latest-amd64

  docker manifest create fragaria/karmen-backend:latest \
              fragaria/karmen-backend:latest-amd64 \
              fragaria/karmen-backend:latest-armhf
  docker manifest annotate fragaria/karmen-backend:latest fragaria/karmen-backend:latest-armhf --arch arm
  docker manifest annotate fragaria/karmen-backend:latest fragaria/karmen-backend:latest-amd64 --arch amd64

  docker manifest push fragaria/karmen-backend:latest
fi

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
