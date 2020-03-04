import os
import json
import sentry_sdk
from flask import Flask
from flask_cors import CORS
from celery import Celery
from flask_jwt_extended import JWTManager
from flask_executor import Executor
from sentry_sdk.integrations.flask import FlaskIntegration

__version__ = "0.8.0-rc1"
__author__ = "Jirka Chadima"
__copyright__ = (
    "Copyright (C) 2019 Fragaria s.r.o. - Released under terms of AGPLv3 License"
)
__license__ = "GNU Affero General Public License http://www.gnu.org/licenses/agpl.html"


def setup_celery(flask_app):
    redis_backend = "redis://%s:%s" % (
        app.config["REDIS_HOST"],
        app.config["REDIS_PORT"],
    )
    celery_inst = Celery(
        flask_app.import_name, backend=redis_backend, broker=redis_backend,
    )
    celery_inst.conf.update(json.loads(flask_app.config["CELERY_CONFIG"]))

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


def normalize_val(val):
    if isinstance(val, str):
        if val.isdigit():
            return int(val)
        if val.lower() in ("true", "1", "yes", "on"):
            return True
        if val.lower() in ("false", "0", "no", "off"):
            return False
    return val


# configuration
CONFIG_KEYS = {
    "FRONTEND_BASE_URL": "http://set-your-karmen-address-here.com",
    "UPLOAD_FOLDER": "/tmp/karmen-files",
    "NETWORK_TIMEOUT": 2,
    "NETWORK_VERIFY_CERTIFICATES": True,
    "SECRET_KEY": None,
    "REDIS_HOST": "localhost",
    "REDIS_PORT": 6379,
    "POSTGRES_DB": "print3d",
    "POSTGRES_PASSWORD": "print3d",
    "POSTGRES_USER": "print3d",
    "POSTGRES_HOST": "localhost",
    "POSTGRES_PORT": 5432,
    "CLOUD_MODE": False,
    "SOCKET_API_URL": "http://pathset-your-proxy-api-address-here/%s",
    "CELERY_CONFIG": '{"timezone": "Europe/Prague", "beat_schedule": {"check_printers": {"task": "check_printers","schedule": 30.0}}}',
}

for key, defaults in CONFIG_KEYS.items():
    # TODO convert to python types if necessary, booleans are hard in particular
    app.config[key] = normalize_val(os.environ.get(key, defaults))

# This is hardcoded for 1GB
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 1024

# config options combination validation
if app.config.get("SECRET_KEY") is None:
    raise RuntimeError("Cannot start the application: SECRET_KEY cannot be null")

if app.config.get("CLOUD_MODE") and not app.config.get("SOCKET_API_URL"):
    raise RuntimeError(
        "Cannot start the application: CLOUD_MODE is on, but no SOCKET_API_URL was specified"
    )


CORS(app)
app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]
app.config["JWT_ERROR_MESSAGE_KEY"] = "message"
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_ACCESS_COOKIE_PATH"] = "/api/"
app.config["JWT_REFRESH_COOKIE_PATH"] = "/api/users/me/authenticate-refresh"
app.config["JWT_BLACKLIST_ENABLED"] = True
app.config["JWT_BLACKLIST_TOKEN_CHECKS"] = ["access"]

jwt = JWTManager(app)
celery = setup_celery(app)
executor = Executor(app)

import server.routes
import server.tasks
