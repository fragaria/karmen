FROM python:3.7-slim

WORKDIR /usr/src/app

# common requirements (with fakeprinter)
RUN set -e && apt-get update && apt-get install --yes git gcc make postgresql-client libffi-dev jq libpq-dev libpcre2-8-0 python3-dev bash build-essential
RUN set -e && pip install --upgrade pip pipenv 

# Install from lockfile
COPY Pipfile* ./
ENV LIBRARY_PATH=/lib:/usr/lib
RUN set -e && pipenv lock -r > requirements.pip && pip install -r requirements.pip
# remove build requirements not required anymore
RUN apt-get remove --purge --yes gcc make postgresql-client libpq-dev libffi-dev python3-dev

ENV PYTHONPATH=$PYTHONPATH:/usr/src/app
ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 8080

COPY . .
CMD ["./scripts/docker-start.sh"]
