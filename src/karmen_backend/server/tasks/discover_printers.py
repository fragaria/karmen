from server import app, celery


@celery.task(name="discover_printers")
def discover_printers():
    app.logger.warning("discover_printers task is deprecated")
