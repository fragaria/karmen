FROM mhart/alpine-node:10

RUN apk add gettext git g++ make python

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

ARG REACT_APP_GIT_REV
ENV ENV dev

ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 9765

CMD ["./scripts/docker-start.sh"]
