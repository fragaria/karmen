#!/bin/bash
set -e

# kudos https://dev.to/zeerorg/build-multi-arch-docker-images-on-travis-5428

DIR=$(dirname $(realpath -s $0))

cd "${DIR}/../src/karmen_frontend"

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USER" --password-stdin
docker info

docker build --build-arg REACT_APP_GIT_REV="${TRAVIS_BRANCH}" -t fragaria/karmen-frontend:build -f Dockerfile.build .

docker create --name extract fragaria/karmen-frontend:build
docker cp extract:/usr/src/app/build ./build
docker rm -f extract

# Build for amd64 and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --output type=image,name=docker.io/fragaria/karmen-frontend:$TRAVIS_BRANCH-amd64,push=true \
            --opt platform=linux/amd64 \
            --opt filename=./Dockerfile.serve


# Build for armhf and push
buildctl build --frontend dockerfile.v0 \
            --local dockerfile=. \
            --local context=. \
            --output type=image,name=docker.io/fragaria/karmen-frontend:$TRAVIS_BRANCH-armhf,push=true \
            --opt platform=linux/armhf \
            --opt filename=./Dockerfile.serve


export DOCKER_CLI_EXPERIMENTAL=enabled

# Create manifest list and push that
docker manifest create fragaria/karmen-frontend:$TRAVIS_BRANCH \
            fragaria/karmen-frontend:$TRAVIS_BRANCH-amd64 \
            fragaria/karmen-frontend:$TRAVIS_BRANCH-armhf

docker manifest annotate fragaria/karmen-frontend:$TRAVIS_BRANCH fragaria/karmen-frontend:$TRAVIS_BRANCH-armhf --arch arm
docker manifest annotate fragaria/karmen-frontend:$TRAVIS_BRANCH fragaria/karmen-frontend:$TRAVIS_BRANCH-amd64 --arch amd64

docker manifest push fragaria/karmen-frontend:$TRAVIS_BRANCH

# latest only if not rc
if [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then
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
fi

# Delete unnecessary tags
DOCKER_TOKEN=$(curl -s -H "Content-Type: application/json" -X POST -d '{"username": "'${DOCKER_USER}'", "password": "'${DOCKER_PASSWORD}'"}' https://hub.docker.com/v2/users/login/ | jq -r .token)

curl -i -X DELETE \
  -H "Accept: application/json" \
  -H "Authorization: JWT ${DOCKER_TOKEN}" \
  "https://hub.docker.com/v2/repositories/fragaria/karmen-frontend/tags/${TRAVIS_BRANCH}-amd64/"

curl -i -X DELETE \
  -H "Accept: application/json" \
  -H "Authorization: JWT ${DOCKER_TOKEN}" \
  "https://hub.docker.com/v2/repositories/fragaria/karmen-frontend/tags/${TRAVIS_BRANCH}-armhf/"

if [[ "$TRAVIS_TAG" =~ ^v[0-9.]*$ ]]; then
  curl -i -X DELETE \
    -H "Accept: application/json" \
    -H "Authorization: JWT ${DOCKER_TOKEN}" \
    "https://hub.docker.com/v2/repositories/fragaria/karmen-frontend/tags/latest-amd64/"

  curl -i -X DELETE \
    -H "Accept: application/json" \
    -H "Authorization: JWT ${DOCKER_TOKEN}" \
    "https://hub.docker.com/v2/repositories/fragaria/karmen-frontend/tags/latest-armhf/"
fi