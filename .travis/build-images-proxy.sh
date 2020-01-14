#!/bin/bash

# kudos https://dev.to/zeerorg/build-multi-arch-docker-images-on-travis-5428

DIR=$(dirname $(realpath -s $0))

cd "${DIR}/../src/proxy"

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USER" --password-stdin
docker info

# Build for amd64 and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --output type=image,name=docker.io/fragaria/karmen-proxy:$TRAVIS_BRANCH-amd64,push=true \
            --opt platform=linux/amd64 \
            --opt filename=./Dockerfile


# Build for armhf and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --output type=image,name=docker.io/fragaria/karmen-proxy:$TRAVIS_BRANCH-armhf,push=true \
            --opt platform=linux/armhf \
            --opt filename=./Dockerfile


export DOCKER_CLI_EXPERIMENTAL=enabled

# Create manifest list and push that
docker manifest create fragaria/karmen-proxy:$TRAVIS_BRANCH \
            fragaria/karmen-proxy:$TRAVIS_BRANCH-amd64 \
            fragaria/karmen-proxy:$TRAVIS_BRANCH-armhf

docker manifest annotate fragaria/karmen-proxy:$TRAVIS_BRANCH fragaria/karmen-proxy:$TRAVIS_BRANCH-armhf --arch arm
docker manifest annotate fragaria/karmen-proxy:$TRAVIS_BRANCH fragaria/karmen-proxy:$TRAVIS_BRANCH-amd64 --arch amd64

docker manifest push fragaria/karmen-proxy:$TRAVIS_BRANCH

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