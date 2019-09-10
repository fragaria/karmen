FROM mhart/alpine-node:10
RUN apk update && apk upgrade && apk add --no-cache bash git openssh python make g++

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ARG REACT_APP_GIT_REV

RUN npm run build

CMD ["npm", "run", "docker-start"]

EXPOSE 8080