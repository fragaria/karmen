FROM python:3.7-alpine as builder
RUN echo "http://dl-4.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories
WORKDIR /usr/src/app

# build deps
RUN apk --update add --no-cache gcc make openssl-dev jpeg-dev zlib-dev jq python3-dev build-base linux-headers
RUN pip install --upgrade pip

# Install from lockfile
COPY Pipfile* ./
ENV LIBRARY_PATH=/lib:/usr/lib
RUN jq -r '.default | to_entries[] | .key + .value.version' \
    Pipfile.lock > requirements.txt &&  /bin/sh -c "pip install -r requirements.txt"

ENV PYTHONPATH=$PYTHONPATH:/usr/src/app
ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 9766

COPY . .
CMD ["./scripts/docker-start.sh"]