from datetime import datetime, timedelta
from server import app, celery
from server.database.printers import get_printer, add_printer, update_printer
from server.database.network_devices import upsert_network_device
from server.models.octoprint import Octoprint

def save_printer_data(**kwargs):
    has_record = get_printer(kwargs["ip"])
    if has_record is None and not kwargs["client_props"]["connected"]:
        return
    if has_record is None:
        add_printer(**{"name": None, "client_props": {"connected": False, "version": {}, "read_only": True}, **kwargs})
    else:
        update_printer(**{**has_record, **kwargs})

@celery.task(name='sniff_printer')
def sniff_printer(hostname, ip):
    printer = Octoprint(hostname, ip)
    printer.sniff()
    upsert_network_device(
        ip=ip,
        retry_after=None if printer.client.connected else datetime.utcnow() + timedelta(seconds=app.config['NETWORK_RETRY_DEVICE_AFTER']),
        disabled=False
    )
    save_printer_data(
        name=hostname or ip,
        hostname=hostname,
        ip=ip,
        client=printer.client_name(),
        client_props={
            "version": printer.client.version,
            "connected": printer.client.connected,
            "read_only": printer.client.read_only,
        })
