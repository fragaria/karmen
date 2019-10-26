from server import celery
from server.database import settings
from server.database import printers
from server import clients


def save_printer_data(**kwargs):
    has_record = printers.get_printer(kwargs["ip"])
    if has_record is None and not kwargs["client_props"]["connected"]:
        return
    if has_record is None:
        printers.add_printer(
            **{
                "name": None,
                "client_props": {"connected": False, "version": {}, "read_only": True},
                **kwargs,
            }
        )
    else:
        printers.update_printer(
            **{**has_record, **kwargs, **{"name": has_record["name"]}}
        )


@celery.task(name="sniff_printer")
def sniff_printer(hostname, ip):
    printer = clients.get_printer_instance(
        {
            "hostname": hostname,
            "ip": ip,
            "client": "octoprint",  # TODO not only octoprint
        }
    )
    printer.sniff()
    save_printer_data(
        name=hostname or ip,
        hostname=hostname,
        ip=ip,
        client=printer.client_name(),
        client_props={
            "version": printer.client.version,
            "connected": printer.client.connected,
            "read_only": printer.client.read_only,
        },
        printer_props=printer.get_printer_props(),
    )
