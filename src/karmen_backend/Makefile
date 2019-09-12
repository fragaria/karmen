FLASK_APP:=server
FLASK_DEBUG:=true
FLASKR_SETTINGS:=../config.local.cfg

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
