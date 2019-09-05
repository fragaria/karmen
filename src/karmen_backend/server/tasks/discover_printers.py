from datetime import datetime

from server import app, celery, database
from server.services.network import do_arp_scan, get_avahi_hostname
from server.tasks.sniff_printer import update_printer, sniff_printer

@celery.task(name='discover_printers')
def discover_printers():
    now = datetime.utcnow()
    to_deactivate = database.get_printers()
    to_skip_ip = [device["ip"] for device in database.get_network_devices() if (device["retry_after"] and device["retry_after"] > now) or device["disabled"]]
    for line in do_arp_scan(app.config['NETWORK_INTERFACE']):
        (ip, mac) = line
        to_deactivate = [printer for printer in to_deactivate if printer["ip"] != ip]
        if ip in to_skip_ip:
            continue
        hostname = get_avahi_hostname(ip)
        # it's communicating, let's sniff it for a printer
        sniff_printer.delay(hostname, ip)

    for printer in to_deactivate:
        app.logger.debug('%s (%s) was not encountered on the network, deactivating' % (printer["hostname"], printer["ip"]))
        printer["client_props"]["connected"] = False
        update_printer(**printer)
