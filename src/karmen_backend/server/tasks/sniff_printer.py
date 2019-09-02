import re
import json
import requests

from server import app, celery, database

def update_printer(**kwargs):
    has_record = database.get_printer(kwargs["mac"])
    if has_record is None and not kwargs["active"]:
        return
    if has_record is None:
        database.add_printer(**{"name": None, "active": False, "version": {}, **kwargs})
    else:
        database.update_printer(**{**has_record, **kwargs})

def request_network_device(hostname, ip):
    request = None
    if hostname is None and ip is None:
        return request
    # TODO incorporate https somehow
    octoprint_version_uri = "http://%s/api/version"
    try:
        if hostname is not None:
            request = requests.get(octoprint_version_uri % hostname, timeout=2)
    except (requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout):
        app.logger.debug("Cannot call %s, trying %s" % (hostname, ip))
    finally:
        if request is None:
            try:
                request = requests.get(octoprint_version_uri % ip, timeout=2)
            except (requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout):
                app.logger.debug("Cannot call %s" % ip)
    return request

@celery.task(name='sniff_printer')
def sniff_printer(hostname, ip, mac):
    # move request_network_device to models/printer
    request = request_network_device(hostname, ip)
    if request is None:
        app.logger.debug('%s (%s) is not responding on /api/version - not octoprint' % (hostname, ip))
        update_printer(hostname=hostname, ip=ip, mac=mac, active=False)
        return
    if request.status_code != 200:
        app.logger.debug('%s (%s) is responding with %s on /api/version - not octoprint' % (hostname, ip, request.status_code))
        update_printer(hostname=hostname, ip=ip, mac=mac, active=False)
        return
    try:
        data = request.json()
        # TODO test a different response without text field
    except json.decoder.JSONDecodeError:
        app.logger.debug('%s (%s) is not responding with JSON on /api/version - probably not octoprint' % (hostname, ip))
        update_printer(hostname=hostname, ip=ip, mac=mac, active=False)
        return
    if re.match(r'^octoprint', data['text'], re.IGNORECASE) is None:
        app.logger.debug('%s (%s) is responding with %s on /api/version - probably not octoprint' % (hostname, ip, data['text']))
        update_printer(hostname=hostname, ip=ip, mac=mac, active=False, version=data)
        return

    update_printer(name=hostname or ip, hostname=hostname, ip=ip, mac=mac, active=True, version=data)
