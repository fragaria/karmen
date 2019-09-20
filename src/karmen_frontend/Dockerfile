FROM node:10-alpine
RUN apk add python make g++

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

ARG REACT_APP_GIT_REV

RUN npm run build

CMD ["./scripts/docker-start.sh"]

EXPOSE 8080
