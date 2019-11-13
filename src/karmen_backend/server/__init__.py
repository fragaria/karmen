from flask import Flask
from flask_cors import CORS
from celery import Celery
from flask_jwt_extended import JWTManager

__version__ = "0.0.13"
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


app = Flask(__name__)
app.config.from_envvar("FLASKR_SETTINGS", silent=True)
# This is hardcoded for 1GB
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 1024

CORS(app)
app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]
app.config["JWT_ERROR_MESSAGE_KEY"] = "message"

jwt = JWTManager(app)
celery = setup_celery(app)


@jwt.user_claims_loader
def add_claims_to_access_token(user):
    return {
        "role": user["role"],
        "force_pwd_change": user.get("force_pwd_change", False),
    }


@jwt.user_identity_loader
def user_identity_lookup(user):
    return user["uuid"]


import server.routes
import server.tasks
