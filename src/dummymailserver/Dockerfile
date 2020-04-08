FROM python:3.7-alpine as builder
RUN echo "http://dl-4.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories
WORKDIR /usr/src/app

RUN apk --update add --no-cache jq
RUN pip install --upgrade pip

# Install from lockfile
COPY Pipfile* ./
ENV LIBRARY_PATH=/lib:/usr/lib
RUN jq -r '.default | to_entries[] | .key + .value.version' \
    Pipfile.lock > requirements.txt &&  /bin/sh -c "pip install -r requirements.txt"

ENV PYTHONPATH=$PYTHONPATH:/usr/src/app
ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 9767

COPY . .
CMD ["./scripts/docker-start.sh"]