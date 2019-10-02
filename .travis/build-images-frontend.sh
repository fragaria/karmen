#!/bin/bash

# kudos https://dev.to/zeerorg/build-multi-arch-docker-images-on-travis-5428

DIR=`dirname "$0"`

cd "${DIR}/../src/karmen_frontend"

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USER" --password-stdin
docker info

docker build -t fragaria/karmen-frontend:build -f Dockerfile.build .

docker create --name extract fragaria/karmen-frontend:build
docker cp extract:/usr/src/app/build ./build
docker rm -f extract

# Build for amd64 and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --output type=image,name=docker.io/fragaria/karmen-frontend:$TRAVIS_BRANCH-amd64,push=true \
            --opt platform=linux/amd64 \
            --opt build-arg:REACT_APP_GIT_REV=$TRAVIS_BRANCH \
            --opt filename=./Dockerfile.serve


# Build for armhf and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --output type=image,name=docker.io/fragaria/karmen-frontend:$TRAVIS_BRANCH-armhf,push=true \
            --opt platform=linux/armhf \
            --opt build-arg:REACT_APP_GIT_REV=$TRAVIS_BRANCH \
            --opt filename=./Dockerfile.serve


export DOCKER_CLI_EXPERIMENTAL=enabled

# Create manifest list and push that
docker manifest create fragaria/karmen-frontend:$TRAVIS_BRANCH \
            fragaria/karmen-frontend:$TRAVIS_BRANCH-amd64 \
            fragaria/karmen-frontend:$TRAVIS_BRANCH-armhf

docker manifest annotate fragaria/karmen-frontend:$TRAVIS_BRANCH fragaria/karmen-frontend:$TRAVIS_BRANCH-armhf --arch arm
docker manifest annotate fragaria/karmen-frontend:$TRAVIS_BRANCH fragaria/karmen-frontend:$TRAVIS_BRANCH-amd64 --arch amd64

docker manifest push fragaria/karmen-frontend:$TRAVIS_BRANCH

# latest

docker pull fragaria/karmen-frontend:$TRAVIS_BRANCH
docker pull fragaria/karmen-frontend:$TRAVIS_BRANCH-amd64
docker pull fragaria/karmen-frontend:$TRAVIS_BRANCH-armhf
docker tag fragaria/karmen-frontend:$TRAVIS_BRANCH fragaria/karmen-frontend:latest
docker tag fragaria/karmen-frontend:$TRAVIS_BRANCH-amd64 fragaria/karmen-frontend:latest-amd64
docker tag fragaria/karmen-frontend:$TRAVIS_BRANCH-armhf fragaria/karmen-frontend:latest-armhf
docker push fragaria/karmen-frontend:latest
docker push fragaria/karmen-frontend:latest-armhf
docker push fragaria/karmen-frontend:latest-amd64

docker manifest create fragaria/karmen-frontend:latest \
            fragaria/karmen-frontend:latest-amd64 \
            fragaria/karmen-frontend:latest-armhf

docker manifest annotate fragaria/karmen-frontend:latest fragaria/karmen-frontend:latest-armhf --arch arm
docker manifest annotate fragaria/karmen-frontend:latest fragaria/karmen-frontend:latest-amd64 --arch amd64

docker manifest push fragaria/karmen-frontend:latest