FLASK_APP:=server
FLASKR_SETTINGS:=../config.local.cfg

test:
	export FLASK_APP=${FLASK_APP} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && pytest

lint:
	pylint server/ tests/

test-watch:
	export FLASK_APP=${FLASK_APP} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && ptw

coverage:
	export FLASK_APP=${FLASK_APP} && export FLASKR_SETTINGS=${FLASKR_SETTINGS} && coverage run --branch --source server -m pytest

coverage-report: coverage
	coverage report -m

coverage-html: coverage
	coverage html

coveralls:
	coveralls
