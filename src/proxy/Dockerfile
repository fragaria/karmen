FROM nginx:alpine

RUN apk add gettext

ENV BACKEND_HOST backend_flask
ENV BACKEND_PORT 9764

ENV FRONTEND_HOST frontend
ENV FRONTEND_PORT 9765

ENV SERVICE_HOST 0.0.0.0
ENV SERVICE_PORT 9766

COPY ./nginx.conf.template /etc/nginx/nginx.conf.template
COPY . .

CMD ["./docker-start.sh"]
