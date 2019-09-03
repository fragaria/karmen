from server import app, celery, database
from server.models.octoprint import Octoprint

def update_printer(**kwargs):
    has_record = database.get_printer(kwargs["mac"])
    if has_record is None and not kwargs["active"]:
        return
    if has_record is None:
        database.add_printer(**{"name": None, "active": False, "version": {}, **kwargs})
    else:
        database.update_printer(**{**has_record, **kwargs})

@celery.task(name='sniff_printer')
def sniff_printer(hostname, ip, mac):
    printer = Octoprint(hostname, ip, mac)
    result = printer.sniff()
    update_printer(name=hostname or ip, hostname=hostname, ip=ip, mac=mac, active=result["active"], version=result["version"])
