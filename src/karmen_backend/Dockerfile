FROM python:3.6-buster
RUN apt-get update && apt-get upgrade --yes && apt-get install --yes git make g++ libpq-dev avahi-utils arp-scan nginx build-essential
RUN pip install --upgrade pip
RUN pip install pipenv
RUN pip install uwsgi

WORKDIR /usr/src/app

COPY Pipfile* ./
RUN pipenv lock --requirements > requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/usr/src/app
COPY ./scripts/nginx.conf /etc/nginx
RUN chmod +x ./scripts/start-backend.sh

CMD ["./scripts/start-backend.sh"]

EXPOSE 80
