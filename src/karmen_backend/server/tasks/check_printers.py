import redis
from server import app, celery
from server.database import printers
from server import clients
from server.services import network

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
        current_hostname = network.get_avahi_hostname(printer.host)
        printers.update_printer(
            name=printer.name,
            hostname=current_hostname or printer.hostname,
            host=printer.host,
            protocol=printer.protocol,
            client=printer.client_name(),
            client_props={
                "version": printer.client_info.version,
                "connected": printer.client_info.connected,
                "access_level": printer.client_info.access_level,
                "api_key": printer.client_info.api_key,
            },
            printer_props=printer.get_printer_props(),
        )
