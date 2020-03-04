FROM alpine
WORKDIR /usr/src/app

# build deps
RUN apk --update add --no-cache nginx bash gettext

ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 9768

COPY ./scripts/nginx.conf.template /etc/nginx/nginx.conf.template
COPY ./scripts scripts

CMD ["./scripts/docker-start.sh"]