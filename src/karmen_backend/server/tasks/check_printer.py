from server import app, celery
from server.database import printers, network_clients
from server import clients
from server.services import network
from datetime import datetime


@celery.task(name="check_printer")
def check_printer(printer_uuid):
    app.logger.debug("Checking printer %s" % printer_uuid)
    raw_printer = printers.get_printer(printer_uuid)
    raw_client = network_clients.get_network_client(raw_printer["network_client_uuid"])
    printer_data = dict(raw_client)
    printer_data.update(raw_printer)
    printer = clients.get_printer_instance(printer_data)
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
        printer.karmen_sniff()
    else:
        printer.is_alive()

    if (
        printer.client_info.pill_info
        and printer.client_info.pill_info.get("update_status", None) is not None
    ):
        printer.karmen_sniff()

    if printer.hostname != raw_client.get("hostname") or printer.ip != raw_client.get(
        "ip"
    ):
        network_clients.update_network_client(
            uuid=raw_client["uuid"], hostname=printer.hostname, ip=printer.ip,
        )
    printers.update_printer(
        uuid=printer.uuid,
        client_props={
            "version": printer.client_info.version,
            "connected": printer.client_info.connected,
            "access_level": printer.client_info.access_level,
            "api_key": printer.client_info.api_key,
            "webcam": printer.client_info.webcam,
            "plugins": printer.client_info.plugins,
            "pill_info": printer.client_info.pill_info,
        },
    )
