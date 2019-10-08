from datetime import datetime, timedelta
from server import celery
from server.database import settings
from server.database import printers
from server.database import network_devices
from server import drivers

def save_printer_data(**kwargs):
    has_record = printers.get_printer(kwargs["ip"])
    if has_record is None and not kwargs["client_props"]["connected"]:
        return
    if has_record is None:
        printers.add_printer(**{"name": None, "client_props": {"connected": False, "version": {}, "read_only": True}, **kwargs})
    else:
        printers.update_printer(**{**has_record, **kwargs})

@celery.task(name='sniff_printer')
def sniff_printer(hostname, ip):
    printer = drivers.get_printer_instance({
        "hostname": hostname,
        "ip": ip,
        "client": "octoprint", # TODO not only octoprint
    })
    printer.sniff()
    network_devices.upsert_network_device(
        ip=ip,
        retry_after=None if printer.client.connected else datetime.utcnow() + timedelta(seconds=settings.get_val('network_retry_device_after')),
        disabled=False
    )
    save_printer_data(
        name=printer.name or hostname or ip,
        hostname=hostname,
        ip=ip,
        client=printer.client_name(),
        client_props={
            "version": printer.client.version,
            "connected": printer.client.connected,
            "read_only": printer.client.read_only,
        })
