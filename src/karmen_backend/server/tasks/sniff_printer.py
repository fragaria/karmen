from server import app, celery
from server.database import printers
from server import clients


def save_printer_data(**kwargs):
    if not kwargs["client_props"]["connected"]:
        app.logger.info("Printer on %s is not responding as connected" % kwargs["host"])
        return
    has_record = printers.get_printer(kwargs["host"])
    # No need to update registered printers
    if has_record is not None:
        app.logger.info(
            "Printer on %s is already registered within karmen" % kwargs["host"]
        )
        return
    printers.add_printer(
        **{
            "name": None,
            "client_props": {
                "connected": False,
                "version": {},
                "access_level": clients.utils.PrinterClientAccessLevel.PROTECTED,
            },
            **kwargs,
        }
    )


@celery.task(name="sniff_printer")
def sniff_printer(hostname, host):
    app.logger.info("Sniffing printer on %s (%s) - trying http" % (host, hostname))
    printer = clients.get_printer_instance(
        {
            "hostname": hostname,
            "host": host,
            "client": "octoprint",  # TODO not only octoprint
            "protocol": "http",
        }
    )

    printer.sniff()
    # Let's try a secured connection
    if not printer.client_info.connected:
        printer.protocol = "https"
        app.logger.info("Sniffing printer on %s (%s) - trying https" % (host, hostname))
        printer.sniff()

    # Not even on https, no reason to do anything
    if not printer.client_info.connected:
        app.logger.info("Sniffing printer on %s (%s) - no luck" % (host, hostname))
        return

    app.logger.info("Sniffing printer on %s (%s) - success" % (host, hostname))
    save_printer_data(
        name=hostname or host,
        hostname=hostname,
        host=host,
        protocol=printer.protocol,
        client=printer.client_name(),
        client_props={
            "version": printer.client_info.version,
            "connected": printer.client_info.connected,
            "access_level": printer.client_info.access_level,
            "api_key": printer.client_info.api_key,
            "webcam": printer.webcam(),
        },
        printer_props=printer.get_printer_props(),
    )
