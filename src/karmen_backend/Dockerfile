FROM python:3.6-buster
RUN apt-get update && apt-get upgrade --yes && apt-get install --yes git make g++ libpq-dev avahi-utils avahi-daemon arp-scan nginx build-essential
RUN pip install --upgrade pip
RUN pip install pipenv

# enable mdns discovery, this works only when container is run in privileged mode and /var/run/dbus is mounted as a volume
# see https://github.com/ianblenke/docker-avahi for details
RUN update-rc.d avahi-daemon enable

WORKDIR /usr/src/app

COPY Pipfile* ./
RUN pipenv lock --requirements > requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN pip install uwsgi
ENV PYTHONPATH=/usr/src/app
COPY ./scripts/nginx.conf /etc/nginx
RUN chmod +x ./scripts/start-wsgi-backend.sh

CMD ["./scripts/start-wsgi-backend.sh"]

EXPOSE 80
