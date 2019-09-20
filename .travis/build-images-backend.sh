#!/bin/bash

# kudos https://dev.to/zeerorg/build-multi-arch-docker-images-on-travis-5428

DIR=`dirname "$0"`

cd "${DIR}/../src/karmen_backend"

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USER" --password-stdin

# Build for amd64 and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --output type=image,name=docker.io/fragaria/karmen-backend:test-build-amd64,push=true \
            --opt platform=linux/amd64 \
            --opt filename=./Dockerfile


# Build for armhf and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --output type=image,name=docker.io/fragaria/karmen-backend:test-build-armhf,push=true \
            --opt platform=linux/armhf \
            --opt filename=./Dockerfile


export DOCKER_CLI_EXPERIMENTAL=enabled

# Create manifest list and push that
docker manifest create fragaria/karmen-backend:test-build \
            fragaria/karmen-backend:test-build-amd64 \
            fragaria/karmen-backend:test-build-armhf

docker manifest annotate fragaria/karmen-backend:test-build fragaria/karmen-backend:test-build-armhf --arch arm
docker manifest annotate fragaria/karmen-backend:test-build fragaria/karmen-backend:test-build-amd64 --arch amd64

docker manifest push fragaria/karmen-backend:test-build
