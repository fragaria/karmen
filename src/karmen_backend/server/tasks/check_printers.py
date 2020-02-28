from server import app, celery
from server.database import printers
from server import clients
from server.services import network

from server.tasks.check_printer import check_printer


@celery.task(name="check_printers")
def check_printers():
    app.logger.debug("Checking known printers...")
    for raw_printer in printers.get_printers():
        check_printer.delay(raw_printer["uuid"])
