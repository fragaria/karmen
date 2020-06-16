FROM python:3.7-slim

WORKDIR /usr/src/app

# common requirements (with fakeprinter)
RUN set -e && apt-get update && apt-get install --yes git gcc make postgresql-client libffi-dev jq libpq-dev libpcre2-8-0 python3-dev bash build-essential pipenv

# RUN set -e && pip install --upgrade pip pipenv 

# specific for backend
RUN set -e && apt-get install --yes python3-lxml uwsgi python-lxml python3-psycopg2 supervisor libxml2-dev libxslt-dev nginx gettext avahi-utils arp-scan dbus

# Install from lockfile
COPY Pipfile* ./
RUN set -e && pipenv lock -r > requirements.pip && pip install -r requirements.pip
# remove build requirements not required anymore
RUN apt-get remove --purge --yes gcc make postgresql-client libpq-dev libffi-dev python3-dev

# runtime deps
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
