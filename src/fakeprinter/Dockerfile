FROM python:3.7-alpine as builder
RUN echo "http://dl-4.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories

RUN mkdir /install
WORKDIR /install

# build deps
RUN apk --update add --no-cache gcc make openssl-dev jpeg-dev zlib-dev jq python3-dev build-base linux-headers

RUN pip install --upgrade pip

# Install from lockfile
COPY Pipfile* ./
RUN jq -r '.default | to_entries[] | .key + .value.version' \
    Pipfile.lock > requirements.txt && pip install -r requirements.txt


FROM python:3.7-alpine as runner

WORKDIR /usr/src/app

RUN apk add --no-cache bash jpeg-dev

# Install from cache - no need for system dependencies for this
COPY --from=builder /root/.cache /root/.cache
COPY --from=builder /install/requirements.txt requirements.txt
RUN pip install -r requirements.txt

ENV PYTHONPATH=$PYTHONPATH:/usr/src/app

ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 8080

COPY . .

CMD ["./scripts/docker-start.sh"]
