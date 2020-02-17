from server import app, celery
from server.services.network import do_arp_scan, get_avahi_hostname
from server.tasks.sniff_printer import sniff_printer


@celery.task(name="scan_network")
def scan_network(org_uuid, network_interface="wlan0"):
    app.logger.info("Scanning network %s for printers..." % network_interface)
    for line in do_arp_scan(network_interface):
        (ip, _) = line
        hostname = get_avahi_hostname(ip)
        # it's communicating, let's sniff it for a printer
        sniff_printer.delay(org_uuid, hostname, ip)
