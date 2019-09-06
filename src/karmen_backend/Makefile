FLASK_APP:=server
FLASK_DEBUG:=true
FLASKR_SETTINGS:=../config.local.cfg
CELERY_BEAT_PID:=/tmp/karmen-celery-beat-pid
CELERY_WORKER_PID:=/tmp/karmen-celery-worker-pid
FLASK_PID:=/tmp/karmen-flask-pid

install:
	pipenv install --dev
	pipenv shell

test:
	export FLASK_APP=${FLASK_APP} && export FLASK_DEBUG=${FLASK_DEBUG} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && pytest

lint:
	pylint server/ tests/

test-watch:
	export FLASK_APP=${FLASK_APP} && export FLASK_DEBUG=${FLASK_DEBUG} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && ptw

coverage:
	export FLASK_APP=${FLASK_APP} && export FLASK_DEBUG=${FLASK_DEBUG} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && coverage run --branch --source server -m pytest

coverage-report: coverage
	coverage report -m

coverage-html: coverage
	coverage html

coveralls:
	coveralls

celery-beat:
	@-mkdir -p ./tmp/logs
	export FLASK_APP=${FLASK_APP} && export FLASK_DEBUG=${FLASK_DEBUG} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && celery -A server.celery beat

celery-worker:
	@-mkdir -p ./tmp/logs
	export FLASK_APP=${FLASK_APP} && export FLASK_DEBUG=${FLASK_DEBUG} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && celery -A server.celery worker

flask:
	export FLASK_APP=${FLASK_APP} && export FLASK_DEBUG=${FLASK_DEBUG} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && flask run

redis:
	docker run -d -p 6379:6379 redis

start-dev:
	@-mkdir -p ./tmp/logs
	export FLASK_APP=${FLASK_APP} && export FLASK_DEBUG=${FLASK_DEBUG} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && celery -A server.celery beat & echo $$! > $(CELERY_BEAT_PID)
	export FLASK_APP=${FLASK_APP} && export FLASK_DEBUG=${FLASK_DEBUG} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && celery -A server.celery worker & echo $$! > $(CELERY_WORKER_PID)
	export FLASK_APP=${FLASK_APP} && export FLASK_DEBUG=${FLASK_DEBUG} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && flask run & echo $$! > $(FLASK_PID)

stop-dev:
	@-kill `cat $(CELERY_BEAT_PID)` 2> /dev/null || true
	@-kill `cat $(CELERY_WORKER_PID)` 2> /dev/null || true
	@-kill `cat $(FLASK_PID)` 2> /dev/null || true
	@-rm $(CELERY_BEAT_PID)
	@-rm $(CELERY_WORKER_PID)
	@-rm $(FLASK_PID)
	@-killall celery