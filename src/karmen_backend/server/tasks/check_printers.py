from server import app, celery
from server.database.printers import get_printers, update_printer
from server import models

@celery.task(name='check_printers')
def check_printers():
    app.logger.debug('Checking known printers...')
    for raw_printer in get_printers():
        # TODO not only octoprint
        printer = models.get_printer_instance(raw_printer)
        printer.is_alive()
        update_printer(
            name=printer.name,
            hostname=printer.hostname,
            ip=printer.ip,
            client=printer.client_name(),
            client_props={
                "version": printer.client.version,
                "connected": printer.client.connected,
                "read_only": printer.client.read_only,
            }
        )
