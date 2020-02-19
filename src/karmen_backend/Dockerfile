FROM python:3.7-alpine as builder
RUN echo "http://dl-4.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories

RUN mkdir /install
WORKDIR /install

# build deps
RUN apk --update add --no-cache gcc make postgresql-client postgresql-dev openssl-dev libffi-dev jq pcre-dev python3-dev build-base linux-headers

RUN pip install --upgrade pip
RUN pip install uwsgi supervisor

# Install from lockfile
COPY Pipfile* ./
RUN jq -r '.default | to_entries[] | .key + .value.version' \
    Pipfile.lock > requirements.txt && pip install -r requirements.txt


FROM python:3.7-alpine as runner
RUN echo "http://dl-4.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories

# runtime deps
RUN apk --update add --no-cache nginx gettext avahi avahi-tools arp-scan postgresql-client bash

# ensure www-data user
RUN set -x ; \
  addgroup -g 82 -S www-data ; \
  adduser -u 82 -D -S -G www-data www-data && exit 0 ; exit 1

WORKDIR /usr/src/app

# Install from cache - no need for system dependencies for this
COPY --from=builder /root/.cache /root/.cache
COPY --from=builder /install/requirements.txt requirements.txt
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install uwsgi supervisor

ENV PYTHONPATH=$PYTHONPATH:/usr/src/app

ENV REDIS_HOST 127.0.0.1
ENV REDIS_PORT 6379
ENV POSTGRES_HOST 127.0.0.1
ENV POSTGRES_PORT 5432
ENV POSTGRES_DB print3d
ENV POSTGRES_DB_PASSWORD print3d
ENV POSTGRES_DB_USER print3d

ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 9764

COPY ./scripts/nginx.conf.template /etc/nginx/nginx.conf.template
COPY ./scripts/uwsgi.ini /etc/uwsgi/uwsgi.ini
COPY ./scripts/uwsgi-webcam-snapshots.ini /etc/uwsgi/uwsgi-webcam-snapshots.ini
COPY ./scripts/supervisord.conf /etc/supervisord.conf

COPY . .

CMD ["./scripts/docker-start.sh"]
