#!/bin/bash

# kudos https://dev.to/zeerorg/build-multi-arch-docker-images-on-travis-5428

cd src/karmen-backend
docker login --username $DOCKER_USER --password $DOCKER_PASSWORD

# Build for amd64 and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --exporter image \
            --exporter-opt name=docker.io/fragaria/karmen-backend:test-build-amd64 \
            --exporter-opt push=true \
            --frontend-opt platform=linux/amd64 \
            --frontend-opt filename=./Dockerfile


# Build for armhf and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --exporter image \
            --exporter-opt name=docker.io/fragaria/karmen-backend:test-build-armhf \
            --exporter-opt push=true \
            --frontend-opt platform=linux/armhf \
            --frontend-opt filename=./Dockerfile


export DOCKER_CLI_EXPERIMENTAL=enabled

# Create manifest list and push that
docker manifest create fragaria/karmen-backend:test-build \
            fragaria/karmen-backend:test-build-amd64 \
            fragaria/karmen-backend:test-build-armhf

docker manifest annotate fragaria/karmen-backend:test-build fragaria/karmen-backend:test-build-armhf --arch arm
docker manifest annotate fragaria/karmen-backend:test-build fragaria/karmen-backend:test-build-amd64 --arch amd64

docker manifest push fragaria/karmen-backend:test-build
