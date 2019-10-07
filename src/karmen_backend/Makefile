FLASK_APP:=server
FLASKR_SETTINGS:=../config.test.cfg

run-docker-postgres:
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test
	docker run --name karmen_pg_test \
		-e POSTGRES_PASSWORD=print3d \
		-e POSTGRES_USER=print3d \
		-e POSTGRES_DB=print3d \
		-p 5433:5432 \
		-v "$(shell pwd)/db/migrations/V0001__initial_schema.sql":/docker-entrypoint-initdb.d/10-init.sql \
		-v "$(shell pwd)/db/fake-printers.sql":/docker-entrypoint-initdb.d/20-fake-printers.sql \
		--privileged=true postgres &
	while ! pg_isready --port 5433 --host localhost > /dev/null 2>&1; do echo 'Waiting for postgres...'; sleep 1; done

test: run-docker-postgres
	export FLASK_APP=${FLASK_APP} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && pytest
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test

lint:
	pylint server/ tests/

test-watch: run-docker-postgres
	export FLASK_APP=${FLASK_APP} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && ptw
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test

coverage: run-docker-postgres
	export FLASK_APP=${FLASK_APP} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && coverage run --branch --source server -m pytest
	@-docker stop karmen_pg_test
	@-docker rm karmen_pg_test

coverage-report: coverage
	coverage report -m

coverage-html: coverage
	coverage html

coveralls:
	coveralls
