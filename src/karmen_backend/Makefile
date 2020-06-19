FLASK_APP:=server
POSTGRES_PASSWORD?=print3dtest
POSTGRES_USER?=print3dtest
POSTGRES_DB?=print3dtest
POSTGRES_HOST?=localhost
POSTGRES_PORT?=54350
REDIS_PORT?=6380
CELERY_CONFIG?={}
SECRET_KEY?=tests
LOCAL_TESTS_TOKEN?=This token is to enable local admin used for tests and to verify requests to it

run-docker-test-postgres:
	if [ ! -z `docker ps -qa -f name=karmen_pg_test -f status=running` ]; then docker stop karmen_pg_test; fi
	if [ ! -z `docker ps -qa -f name=karmen_pg_test -f status=exited` ]; then docker rm karmen_pg_test; fi
	docker run --detach --name karmen_pg_test \
		-e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
		-e POSTGRES_USER=${POSTGRES_USER} \
		-e POSTGRES_DB=${POSTGRES_DB} \
		-p ${POSTGRES_PORT}:5432 \
		postgres:11
	while ! pg_isready --port ${POSTGRES_PORT} --host ${POSTGRES_HOST} > /dev/null 2>&1; do printf 'Waiting for postgress: % 3ds\r' $$n; n=$$((n+1)); sleep 1; done
	ENV=test REDIS_PORT=${REDIS_PORT} POSTGRES_PORT=${POSTGRES_PORT} POSTGRES_PASSWORD=${POSTGRES_PASSWORD} POSTGRES_USER=${POSTGRES_USER} POSTGRES_DB=${POSTGRES_DB} POSTGRES_HOST=${POSTGRES_HOST} bash ./scripts/migrate.sh

run-docker-test-redis:
	if [ ! -z `docker ps -qa -f name=karmen_redis_test -f status=running` ]; then docker stop karmen_redis_test; fi
	if [ ! -z `docker ps -qa -f name=karmen_redis_test -f status=exited` ]; then docker rm karmen_redis_test; fi
	docker run --detach --name karmen_redis_test \
		-p ${REDIS_PORT}:6379 \
		redis:5

test: run-docker-test-redis run-docker-test-postgres
	FLASK_APP=${FLASK_APP} \
	POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
	POSTGRES_USER=${POSTGRES_USER} \
	POSTGRES_DB=${POSTGRES_DB} \
	POSTGRES_HOST=${POSTGRES_HOST} \
	POSTGRES_PORT=${POSTGRES_PORT} \
	REDIS_PORT=${REDIS_PORT} \
	CELERY_CONFIG=${CELERY_CONFIG} \
	SECRET_KEY=${SECRET_KEY} \
	LOCAL_TESTS_TOKEN="${LOCAL_TESTS_TOKEN}" \
	  pytest -n auto --dist=loadscope $(test_args)
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test
	@-docker stop karmen_redis_test
	@-docker rm karmen_redis_test

test-isolated:
	docker-compose -f docker-compose.test.yml up --build test
	docker-compose -f docker-compose.test.yml stop

format:
	black server/ tests/

lint:
	pylint server/ tests/

test-watch: run-docker-test-redis run-docker-test-postgres
	FLASK_APP=${FLASK_APP} \
	POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
	POSTGRES_USER=${POSTGRES_USER} \
	POSTGRES_DB=${POSTGRES_DB} \
	POSTGRES_HOST=${POSTGRES_HOST} \
	POSTGRES_PORT=${POSTGRES_PORT} \
	REDIS_PORT=${REDIS_PORT} \
	CELERY_CONFIG=${CELERY_CONFIG} \
	SECRET_KEY=${SECRET_KEY} \
	LOCAL_TESTS_TOKEN="${LOCAL_TESTS_TOKEN}" \
	  pytest --looponfail -n auto --dist=loadscope $(test_args)
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test
	@-docker stop karmen_redis_test
	@-docker rm karmen_redis_test

coverage: run-docker-test-redis run-docker-test-postgres
	FLASK_APP=${FLASK_APP} \
	POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
	POSTGRES_USER=${POSTGRES_USER} \
	POSTGRES_DB=${POSTGRES_DB} \
	POSTGRES_HOST=${POSTGRES_HOST} \
	POSTGRES_PORT=${POSTGRES_PORT} \
	REDIS_PORT=${REDIS_PORT} \
	CELERY_CONFIG=${CELERY_CONFIG} \
	SECRET_KEY=${SECRET_KEY} \
	LOCAL_TESTS_TOKEN="${LOCAL_TESTS_TOKEN}"\
	  coverage run --branch --source server -m pytest
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test
	@-docker stop karmen_redis_test
	@-docker rm karmen_redis_test

coverage-report: coverage
	coverage report -m

coverage-html: coverage
	coverage html

coveralls:
	coveralls
