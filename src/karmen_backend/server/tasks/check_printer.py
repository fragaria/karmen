from server import app, celery
from server.database import printers
from server import clients
from server.services import network
from datetime import datetime


@celery.task(name="check_printer")
def check_printer(printer_uuid):
    app.logger.debug("Checking printer %s" % printer_uuid)
    raw_printer = printers.get_printer(printer_uuid)
    printer = clients.get_printer_instance(raw_printer)
    # websocket printers are not expected to change
    if printer.protocol in ["http", "https"]:
        if printer.hostname is not None:
            current_ip = network.get_avahi_address(printer.hostname)
            if current_ip is not None and current_ip != printer.ip:
                printer.ip = current_ip
                printer.update_network_base()
        hostname = network.get_avahi_hostname(printer.ip)
        if hostname is not None and hostname != printer.hostname:
            printer.hostname = hostname
            printer.update_network_base()
    now = datetime.now()
    if now.minute % 15 == 0 and printer.client_info.connected:
        printer.sniff()
    else:
        printer.is_alive()

    printers.update_printer(
        uuid=printer.uuid,
        hostname=printer.hostname,
        ip=printer.ip,
        client_props={
            "version": printer.client_info.version,
            "connected": printer.client_info.connected,
            "access_level": printer.client_info.access_level,
            "api_key": printer.client_info.api_key,
            "webcam": printer.client_info.webcam,
            "plugins": printer.client_info.plugins,
        },
    )
