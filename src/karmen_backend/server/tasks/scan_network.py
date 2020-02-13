from server import app, celery
from server.services.network import do_arp_scan, get_avahi_hostname
from server.tasks.sniff_printer import sniff_printer


@celery.task(name="scan_network")
# TODO organization_uuid
def scan_network(network_interface="wlan0"):
    app.logger.info("Scanning network for printers...")
    for line in do_arp_scan(network_interface):
        (ip, _) = line
        hostname = get_avahi_hostname(ip)
        # it's communicating, let's sniff it for a printer
        sniff_printer.delay(hostname, ip)
