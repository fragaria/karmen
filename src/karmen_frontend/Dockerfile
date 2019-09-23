FROM mhart/alpine-node:10

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

ARG REACT_APP_GIT_REV
ENV ENV dev

CMD ["./scripts/docker-start.sh"]

EXPOSE 8080
