FROM python:3.6-slim

RUN apt-get update && apt-get install --yes --no-install-recommends libpq-dev avahi-utils avahi-daemon arp-scan build-essential postgresql-client nginx gettext-base

RUN pip install --upgrade pip
RUN pip install pipenv uwsgi

# enable mdns discovery, this works only when container is run in
# privileged mode and /var/run/dbus is mounted as a volume
# see https://github.com/ianblenke/docker-avahi for details
RUN update-rc.d avahi-daemon enable

WORKDIR /usr/src/app
ENV PYTHONPATH=/usr/src/app

COPY Pipfile* ./
RUN pipenv lock --requirements > requirements.txt && pip install --no-cache-dir -r requirements.txt

ENV REDIS_HOST 127.0.0.1
ENV REDIS_PORT 6379
ENV SERVICE_PORT 9764

COPY ./scripts/nginx.conf.template /etc/nginx/nginx.conf.template
COPY . .

CMD ["./scripts/docker-start.sh"]
