import json
import re
import requests
from server import app

def get_with_fallback(endpoint, hostname, ip, protocol='http', timeout=2):
    request = None
    if hostname is None and ip is None:
        return request
    if endpoint[0] != '/':
        endpoint = '/%s' % (endpoint, )
    uri = '%s://%s%s' % (protocol, hostname, endpoint)
    try:
        if hostname is not None:
            request = requests.get(uri, timeout=timeout)
    except requests.exceptions.ConnectionError:
        app.logger.debug("Cannot call %s, trying on %s" % (uri, ip))
    finally:
        if request is None:
            uri = '%s://%s%s' % (protocol, ip, endpoint)
            try:
                request = requests.get(uri, timeout=timeout)
            except requests.exceptions.ConnectionError:
                app.logger.debug("Cannot call %s" % uri)
    return request

class Octoprint(object):
    def __init__(self, hostname, ip, mac, name=None, version=None, active=False):
        self.name = name
        self.hostname = hostname
        self.ip = ip
        self.mac = mac
        self.version = version
        self.active = active

    def sniff(self):
        request = get_with_fallback('/api/version', self.hostname, self.ip)
        if request is None:
            app.logger.debug('%s (%s) is not responding on /api/version - not octoprint' % (self.hostname, self.ip))
            return {"active": False, "version": {}}
        if request.status_code != 200:
            app.logger.debug('%s (%s) is responding with %s on /api/version - not octoprint' % (self.hostname, self.ip, request.status_code))
            return {"active": False, "version": {}}
        try:
            data = request.json()
            # TODO test a different response without text field
        except json.decoder.JSONDecodeError:
            app.logger.debug('%s (%s) is not responding with JSON on /api/version - probably not octoprint' % (self.hostname, self.ip))
            return {"active": False, "version": {}}
        if re.match(r'^octoprint', data['text'], re.IGNORECASE) is None:
            app.logger.debug('%s (%s) is responding with %s on /api/version - probably not octoprint' % (self.hostname, self.ip, data["text"]))
            return {
                "active": False,
                "version": data,
            }
        return {
            "active": True,
            "version": data,
        }

    def status(self):
        request = get_with_fallback('/api/printer?exclude=history', self.hostname, self.ip)
        if request is not None and request.status_code == 200:
            try:
                data = request.json()
                return {
                    "status": data["state"]["text"],
                    "temperature": data["temperature"],
                }
            except json.decoder.JSONDecodeError:
                return None
        elif request is not None and request.status_code == 409:
            return {
                "status": "Printer is not operational"
            }
