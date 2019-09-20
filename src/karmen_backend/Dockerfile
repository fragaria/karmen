FROM python:3.6-slim

ENV \
  DEBCONF_FRONTEND=noninteractive \
  DEBIAN_FRONTEND=noninteractive \
  TERM=xterm-color

RUN apt-get update && apt-get upgrade --yes && apt-get install --yes --no-install-recommends bash git make g++ libpq-dev avahi-utils avahi-daemon arp-scan build-essential wget gnupg ca-certificates software-properties-common libreadline-dev libncurses5-dev libpcre3-dev libssl-dev luarocks libgeoip-dev perl zlib1g-dev

RUN \
  wget https://openresty.org/download/openresty-1.15.8.2.tar.gz && \
  tar -xzvf openresty-*.tar.gz && \
  rm -f openresty-*.tar.gz && \
  cd openresty-* && \
  ./configure \
  --prefix=/usr/local/openresty \
  --with-pcre-jit --with-ipv6 \
  --with-http_stub_status_module \
  --with-luajit  \
  -j2  && \
  make && \
  make install && \
  make clean && \
  cd .. && \
  rm -rf openresty-* && \
  ln -s /usr/local/openresty/bin/openresty /usr/local/bin/openresty && \
  ldconfig

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
