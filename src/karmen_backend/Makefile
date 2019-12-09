FLASK_APP:=server
FLASKR_SETTINGS:=../config.test.cfg

run-docker-test-postgres:
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test
	docker run --name karmen_pg_test \
		-e POSTGRES_PASSWORD=print3d \
		-e POSTGRES_USER=print3d \
		-e POSTGRES_DB=print3d \
		-p 54350:5432 \
		postgres:11 &
	while ! pg_isready --port 54350 --host localhost > /dev/null 2>&1; do echo 'Waiting for postgres...'; sleep 1; done
	ENV=develop POSTGRES_PORT=54350 POSTGRES_HOST=localhost sh ./scripts/migrate.sh

test: run-docker-test-postgres
	export FLASK_APP=${FLASK_APP} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && pytest -n auto --dist=loadscope
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test

format:
	black server/ tests/

lint:
	pylint server/ tests/

test-watch: run-docker-test-postgres
	export FLASK_APP=${FLASK_APP} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && pytest --looponfail -n auto --dist=loadscope
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test

coverage: run-docker-test-postgres
	export FLASK_APP=${FLASK_APP} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && coverage run --branch --source server -m pytest
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test

coverage-report: coverage
	coverage report -m

coverage-html: coverage
	coverage html

coveralls:
	coveralls
