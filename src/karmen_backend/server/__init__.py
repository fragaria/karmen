from flask import Flask
# from flask_socketio import SocketIO
from flask_cors import CORS
from celery import Celery

def setup_celery(flask_app):
    celery_inst = Celery(
        flask_app.import_name,
        backend=flask_app.config['CELERY_RESULT_BACKEND'],
        broker=flask_app.config['CELERY_BROKER_URL']
    )
    celery_inst.conf.update(flask_app.config['CELERY_CONFIG'])

    class ContextTask(celery_inst.Task):
        def __call__(self, *args, **kwargs):
            with flask_app.app_context():
                return self.run(*args, **kwargs)

    celery_inst.Task = ContextTask
    return celery_inst

app = Flask(__name__)
app.config.from_envvar('FLASKR_SETTINGS', silent=True)

CORS(app)
celery = setup_celery(app)
#socketio = SocketIO(app)

import server.routes
import server.tasks
# import server.socketevents
