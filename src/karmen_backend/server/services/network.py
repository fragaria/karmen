import subprocess
import re

from server import app


def do_arp_scan(network_interface):
    # TODO replace with check_output
    proc = subprocess.Popen(
        ["arp-scan", "--interface", network_interface, "--localnet", "-q"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    devices = []
    while True:
        rawerr = proc.stderr.readline() if proc.stderr else None
        if rawerr:
            app.logger.error("arp-scan error: %s" % rawerr.rstrip().decode("utf-8"))
            break
        rawline = proc.stdout.readline()
        if not rawline:
            break
        line = rawline.rstrip().decode("utf-8")
        if not line:
            continue
        match = re.findall(r"^([0-9\.]+)[ \t]+([a-z0-9\:]+)$", line)
        if not match:
            continue
        devices.append(match[0])
    return devices


def get_avahi_hostname(ip_address):
    # TODO replace with check_output
    proc = subprocess.Popen(
        ["avahi-resolve-address", ip_address],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    while True:
        rawerr = proc.stderr.readline() if proc.stderr else None
        if rawerr:
            app.logger.error(
                "avahi-resolve-address error: %s" % rawerr.rstrip().decode("utf-8")
            )
            break
        rawline = proc.stdout.readline()
        if not rawline:
            break
        line = rawline.rstrip().decode("utf-8")
        if not line:
            continue
        match = re.findall(r"^([0-9\.]+)[ \t]+(.+)", line)
        if not match:
            continue
        if match[0][1][-6] != ".local":
            return "%s.local" % match[0][1]
        return match[0][1]


def get_avahi_address(hostname):
    # -4 ensures that an IPv4 address is resolved, we might get IPv6 otherwise
    proc = subprocess.Popen(
        ["avahi-resolve-host-name", "-4", hostname],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    while True:
        rawerr = proc.stderr.readline() if proc.stderr else None
        if rawerr:
            app.logger.error(
                "avahi-resolve-host-name error: %s" % rawerr.rstrip().decode("utf-8")
            )
            break
        rawline = proc.stdout.readline()
        if not rawline:
            break
        line = rawline.rstrip().decode("utf-8")
        if not line:
            continue

        match = re.findall(
            r"^([0-9a-zA-Z\.-]+)[ \t]+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", line
        )
        if not match:
            continue
        return match[0][1]
