import redis
from server import app, celery
from server.database import printers
from server import clients

redis = redis.Redis(
    host=app.config["WEBCAM_PROXY_CACHE_HOST"],
    port=app.config["WEBCAM_PROXY_CACHE_PORT"],
)


@celery.task(name="check_printers")
def check_printers():
    app.logger.debug("Checking known printers...")
    for raw_printer in printers.get_printers():
        printer = clients.get_printer_instance(raw_printer)
        printer.is_alive()

        if printer.client_info.connected:
            webcam = printer.webcam()
            try:
                if "stream" in webcam:
                    redis.set("webcam_%s" % (printer.host,), webcam["stream"])
                else:
                    redis.delete("webcam_%s" % (printer.host,))
            except Exception as e:
                app.logger.error(
                    "Cannot save webcam proxy information into cache: %s", e
                )
        printers.update_printer(
            name=printer.name,
            hostname=printer.hostname,
            host=printer.host,
            protocol=printer.protocol,
            client=printer.client_name(),
            client_props={
                "version": printer.client_info.version,
                "connected": printer.client_info.connected,
                "read_only": printer.client_info.read_only,
                "protected": printer.client_info.protected,
            },
            printer_props=printer.get_printer_props(),
        )
