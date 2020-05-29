FROM python:3.7-alpine
# for arp-scan (used in self hosted mode of karmen)
RUN echo "http://dl-4.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories

# ensure www-data user
RUN set -x ; \
  addgroup -g 82 -S www-data ; \
  adduser -u 82 -D -S -G www-data www-data && exit 0 ; exit 1

WORKDIR /usr/src/app

# build deps
RUN apk add --update --no-cache gcc make postgresql-client postgresql-dev openssl-dev libffi-dev jq pcre-dev python3-dev build-base linux-headers libxml2-dev libxslt-dev


RUN pip install --upgrade pipenv pip

# Install from lockfile
COPY Pipfile* ./
RUN pipenv install --system --deploy
RUN pip install uwsgi supervisor
# build deps
RUN apk del gcc make postgresql-client postgresql-dev openssl-dev libffi-dev jq pcre-dev python3-dev build-base linux-headers libxml2-dev libxslt-dev

# runtime deps
RUN apk add --no-cache nginx gettext avahi avahi-tools arp-scan postgresql-client bash dbus

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
ENV TOKEN_SERVER_API_URL ''

COPY ./scripts/nginx.conf.template /etc/nginx/nginx.conf.template
COPY ./scripts/uwsgi.ini /etc/uwsgi/uwsgi.ini
COPY ./scripts/uwsgi-webcam-snapshots.ini /etc/uwsgi/uwsgi-webcam-snapshots.ini
COPY ./scripts/supervisord.conf /etc/supervisord.conf

COPY . .

CMD ["./scripts/docker-start.sh"]
