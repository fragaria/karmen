from server import app, celery
from server.database import printers
from server import clients
from server.services import network


@celery.task(name="check_printers")
def check_printers():
    app.logger.debug("Checking known printers...")
    for raw_printer in printers.get_printers():
        printer = clients.get_printer_instance(raw_printer)
        if printer.hostname is not None:
            current_ip = network.get_avahi_address(printer.hostname)
            if current_ip is not None and current_ip != printer.ip:
                printer.ip = current_ip
                printer.update_network_host()
        else:
            hostname = network.get_avahi_hostname(printer.ip)
            if hostname is not None:
                printer.hostname = hostname
                printer.update_network_host()
        printer.is_alive()
        printers.update_printer(
            uuid=printer.uuid,
            organization_uuid=printer.organization_uuid,
            name=printer.name,
            hostname=printer.hostname,
            ip=printer.ip,
            port=printer.port,
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
