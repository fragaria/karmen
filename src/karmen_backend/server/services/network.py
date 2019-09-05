import subprocess
import re

def do_arp_scan(network_interface):
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
