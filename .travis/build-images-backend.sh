#!/bin/bash
set -e

# kudos https://dev.to/zeerorg/build-multi-arch-docker-images-on-travis-5428

DIR=$(dirname $(realpath -s $0))

cd "${DIR}/../src/karmen_backend"

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USER" --password-stdin
docker info

# Build for amd64 and push
if [[ "$1" = "amd" ]]; then

  buildctl build --frontend dockerfile.v0 \
              --local dockerfile=. \
              --local context=. \
              --output type=image,name=docker.io/fragaria/karmen-backend:$TRAVIS_BRANCH-amd64,push=true \
              --opt platform=linux/amd64 \
              --opt filename=./Dockerfile
fi

# Build for armhf and push, but only for major releases
if [[ "$1" = "arm" ]] && [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then
  buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --output type=image,name=docker.io/fragaria/karmen-backend:$TRAVIS_BRANCH-armhf,push=true \
            --opt platform=linux/armhf \
            --opt filename=./Dockerfile
fi
