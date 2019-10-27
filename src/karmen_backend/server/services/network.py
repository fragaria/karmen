import subprocess
import re
import requests

from server import app


def do_arp_scan(network_interface):
    proc = subprocess.Popen(
        ["arp-scan", "--interface", network_interface, "--localnet", "-q"],
        stdout=subprocess.PIPE,
    )
    devices = []
    while True:
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


def get_avahi_hostname(ip):
    proc = subprocess.Popen(["avahi-resolve-address", ip], stdout=subprocess.PIPE)
    while True:
        rawline = proc.stdout.readline()
        if not rawline:
            break
        line = rawline.rstrip().decode("utf-8")
        if not line:
            continue
        match = re.findall(r"^([0-9\.]+)[ \t]+(.+)", line)
        if not match:
            continue
        return match[0][1]


def get_uri(ip, endpoint="/", protocol="http", timeout=None):
    timeout = timeout if timeout else app.config.get("NETWORK_TIMEOUT", 10)
    do_cert_verification = app.config.get("NETWORK_VERIFY_CERTIFICATES", True)
    request = None
    if ip is None:
        return request
    if endpoint[0] != "/":
        endpoint = "/%s" % (endpoint,)
    uri = "%s://%s%s" % (protocol, ip, endpoint)
    try:
        request = requests.get(uri, timeout=timeout, verify=do_cert_verification)
    except (requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout) as e:
        app.logger.debug("Cannot call %s because %s" % (uri, e))
    return request


# TODO refactor and unify with get_uri, or maybe drop in favour of requests.session
def post_uri(
    ip, endpoint="/", protocol="http", timeout=None, files=None, data=None, json=None
):
    timeout = timeout if timeout else app.config.get("NETWORK_TIMEOUT", 10)
    do_cert_verification = app.config.get("NETWORK_VERIFY_CERTIFICATES", True)
    request = None
    if ip is None:
        return request
    if (json and data) or (json and files):
        raise Exception("Cannot pass json and data/files at the same time")

    if endpoint[0] != "/":
        endpoint = "/%s" % (endpoint,)
    uri = "%s://%s%s" % (protocol, ip, endpoint)
    try:
        request = requests.post(
            uri,
            timeout=timeout,
            files=files,
            data=data,
            json=json,
            verify=do_cert_verification,
        )
    except (requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout):
        app.logger.debug("Cannot call %s" % (uri))
    return request
