FROM python:3.6-slim
RUN apt-get update && apt-get upgrade --yes && apt-get install --yes --no-install-recommends bash git make g++ libpq-dev avahi-utils avahi-daemon arp-scan build-essential wget gnupg ca-certificates software-properties-common
RUN wget -O - https://openresty.org/package/pubkey.gpg | apt-key add -
RUN add-apt-repository --yes "deb http://openresty.org/package/debian $(lsb_release -sc) openresty"
RUN apt-get update && apt-get install --yes --no-install-recommends openresty

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

COPY . .
COPY ./scripts/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

CMD ["./scripts/docker-start.sh"]

EXPOSE 8080
