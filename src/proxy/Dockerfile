FROM fragaria/python-openresty

RUN apt-get update && apt-get install --yes --no-install-recommends gettext-base

ENV REDIS_HOST 127.0.0.1
ENV REDIS_PORT 6379

ENV BACKEND_HOST backend_flask
ENV BACKEND_PORT 9764

ENV FRONTEND_HOST frontend
ENV FRONTEND_PORT 9765

ENV SERVICE_PORT 9766

COPY ./nginx.conf.template /usr/local/openresty/nginx/conf/nginx.conf.template
COPY . .

CMD ["./docker-start.sh"]
