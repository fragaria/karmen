FROM python:3.7-slim as builder

RUN mkdir /install
WORKDIR /install

# build deps
RUN apt-get update && apt-get install --yes --no-install-recommends build-essential zlib1g-dev libjpeg-dev jq

RUN pip install --upgrade pip
RUN pip install uwsgi supervisor

# Install from lockfile
COPY Pipfile* ./
RUN jq -r '.default | to_entries[] | .key + .value.version' \
    Pipfile.lock > requirements.txt && pip install -r requirements.txt


FROM python:3.7-slim as runner

WORKDIR /usr/src/app

# Install from cache - no need for system dependencies for this
COPY --from=builder /root/.cache /root/.cache
COPY --from=builder /install/requirements.txt requirements.txt
RUN pip install -r requirements.txt


ENV PYTHONPATH=$PYTHONPATH:/usr/src/app

ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 8080

COPY . .

CMD ["./scripts/docker-start.sh"]
