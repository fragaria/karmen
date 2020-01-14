FROM python:3.7-slim as builder

RUN mkdir /install
WORKDIR /install

# build deps
RUN apt-get update && apt-get install --yes --no-install-recommends build-essential postgresql-client libpq-dev libssl-dev libffi-dev zlib1g-dev libjpeg-dev jq

RUN pip install --upgrade pip
RUN pip install uwsgi supervisor

# Install from lockfile
COPY Pipfile* ./
RUN jq -r '.default | to_entries[] | .key + .value.version' \
    Pipfile.lock > requirements.txt && pip install -r requirements.txt


FROM python:3.7-slim as runner

# runtime deps
RUN apt-get update && apt-get install --yes --no-install-recommends nginx gettext-base avahi-utils avahi-daemon arp-scan postgresql-client

WORKDIR /usr/src/app

# Install from cache - no need for system dependencies for this
COPY --from=builder /root/.cache /root/.cache
COPY --from=builder /install/requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN pip install --upgrade pip
RUN pip install uwsgi supervisor

# enable mdns discovery, this works only when container is run in
# privileged mode and /var/run/dbus is mounted as a volume
# see https://github.com/ianblenke/docker-avahi for details
RUN update-rc.d avahi-daemon enable

ENV PYTHONPATH=$PYTHONPATH:/usr/src/app

ENV REDIS_HOST 127.0.0.1
ENV REDIS_PORT 6379

ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 9764

COPY ./scripts/nginx.conf.template /etc/nginx/nginx.conf.template
COPY ./scripts/uwsgi.ini /etc/uwsgi/wsgi.ini
COPY ./scripts/supervisord.conf /etc/supervisord.conf

COPY . .

CMD ["./scripts/docker-start.sh"]
