import os
import sentry_sdk
from flask import Flask
from flask_cors import CORS
from celery import Celery
from flask_jwt_extended import JWTManager
from flask_executor import Executor
from sentry_sdk.integrations.flask import FlaskIntegration

__version__ = "0.7.0-rc6"
__author__ = "Jirka Chadima"
__copyright__ = (
    "Copyright (C) 2019 Fragaria s.r.o. - Released under terms of AGPLv3 License"
)
__license__ = "GNU Affero General Public License http://www.gnu.org/licenses/agpl.html"


def setup_celery(flask_app):
    celery_inst = Celery(
        flask_app.import_name,
        backend=flask_app.config["CELERY_RESULT_BACKEND"],
        broker=flask_app.config["CELERY_BROKER_URL"],
    )
    celery_inst.conf.update(flask_app.config["CELERY_CONFIG"])

    class ContextTask(celery_inst.Task):
        def __call__(self, *args, **kwargs):
            with flask_app.app_context():
                return self.run(*args, **kwargs)

    celery_inst.Task = ContextTask
    return celery_inst


if os.environ.get("SENTRY_DSN") is not None:
    sentry_sdk.init(
        dsn=os.environ.get("SENTRY_DSN"),
        integrations=[FlaskIntegration()],
        release="karmen_backend@%s" % __version__,
    )

app = Flask(__name__)
app.config.from_envvar("FLASKR_SETTINGS", silent=True)
# This is hardcoded for 1GB
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 1024

CORS(app)
app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]
app.config["JWT_ERROR_MESSAGE_KEY"] = "message"
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_ACCESS_COOKIE_PATH"] = "/api/"
app.config["JWT_REFRESH_COOKIE_PATH"] = "/api/users/me/authenticate-refresh"
app.config["JWT_BLACKLIST_ENABLED"] = True
app.config["JWT_BLACKLIST_TOKEN_CHECKS"] = ["access"]

if not app.config.get("REDIS_HOST"):
    app.config["REDIS_HOST"] = os.environ.get("REDIS_HOST", "localhost")
if not app.config.get("REDIS_PORT"):
    app.config["REDIS_PORT"] = os.environ.get("REDIS_PORT", 6379)

jwt = JWTManager(app)
celery = setup_celery(app)
executor = Executor(app)

import server.routes
import server.tasks
