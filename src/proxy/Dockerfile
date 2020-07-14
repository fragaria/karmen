FROM nginx:alpine

RUN apk add gettext

ENV BACKEND_HOST backend_flask
ENV BACKEND_PORT 9764

ENV FRONTEND_HOST frontend
ENV FRONTEND_PORT 9765

ENV APIDOC_HOST api_doc
ENV APIDOC_PORT 9898

ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 9766

COPY ./nginx.conf.template /etc/nginx/nginx.conf.template
COPY ./includes-dev /etc/nginx/includes-dev
COPY ./html/503.html /etc/nginx/html/503.html
COPY . .

CMD ["./docker-start.sh"]
