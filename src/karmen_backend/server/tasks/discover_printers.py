from datetime import datetime
import subprocess
import re

from server import app, celery, database
from server.tasks.sniff_printer import update_printer, sniff_printer

def get_network_devices(network_interface):
    proc = subprocess.Popen(["arp-scan", "--interface", network_interface, "--localnet", "-q"], stdout=subprocess.PIPE)
    devices = []
    while True:
        rawline = proc.stdout.readline()
        if not rawline:
            break
        line = rawline.rstrip().decode('utf-8')
        if not line:
            continue
        match = re.findall(r"^([0-9\.]+)[ \t]+([a-z0-9\:]+)$", line)
        if not match:
            continue
        devices.append(match[0])
    return devices

def get_avahi_hostname(ip):
    proc = subprocess.Popen(["avahi-resolve-address", ip], stdout=subprocess.PIPE)
    while True:
        rawline = proc.stdout.readline()
        if not rawline:
            break
        line = rawline.rstrip().decode('utf-8')
        if not line:
            continue
        match = re.findall(r"^([0-9\.]+)[ \t]+(.+)", line)
        if not match:
            continue
        return match[0][1]

@celery.task(name='discover_printers')
def discover_printers():
    now = datetime.utcnow()
    to_deactivate = database.get_printers()
    to_skip = [device["mac"] for device in database.get_network_devices() if device["retry_after"] and device["retry_after"] > now]
    for line in get_network_devices(app.config['NETWORK_INTERFACE']):
        (ip, mac) = line
        to_deactivate = [printer for printer in to_deactivate if printer["mac"] != mac]
        if mac in to_skip:
            continue
        hostname = get_avahi_hostname(ip)
        # it's communicating, let's sniff it for a printer
        sniff_printer.delay(hostname, ip, mac)

    for printer in to_deactivate:
        app.logger.debug('%s (%s) (%s) was not encountered on the network, deactivating' % (printer["hostname"], printer["ip"], printer["mac"]))
        printer["client_props"]["connected"] = False
        update_printer(**printer)
