from server import app, celery
from server.database import settings
from server.services.network import do_arp_scan, get_avahi_hostname
from server.tasks.sniff_printer import sniff_printer


@celery.task(name="scan_network")
def scan_network():
    app.logger.info("Scanning network for printers...")
    for line in do_arp_scan(settings.get_val("network_interface")):
        (host, _) = line
        hostname = get_avahi_hostname(host)
        # it's communicating, let's sniff it for a printer
        sniff_printer.delay(hostname, host)
