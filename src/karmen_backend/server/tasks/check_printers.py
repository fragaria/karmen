from server import app, celery
from server.database import printers
from server import drivers

@celery.task(name='check_printers')
def check_printers():
    app.logger.debug('Checking known printers...')
    for raw_printer in printers.get_printers():
        # TODO not only octoprint
        printer = drivers.get_printer_instance(raw_printer)
        printer.is_alive()
        printers.update_printer(
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
