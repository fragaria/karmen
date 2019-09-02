import json
import requests
from server import app

def get_with_fallback(endpoint, hostname, ip, protocol='http'):
    request = None
    if hostname is None and ip is None:
        return request
    uri = '%s://%s/%s' % (protocol, hostname, endpoint)
    try:
        if hostname is not None:
            request = requests.get(uri)
    except requests.exceptions.ConnectionError:
        app.logger.debug("Cannot call %s, trying on %s" % (uri, ip))
    finally:
        if request is None:
            uri = '%s://%s/%s' % (protocol, ip, endpoint)
            try:
                request = requests.get(uri)
            except requests.exceptions.ConnectionError:
                app.logger.debug("Cannot call %s" % uri)
    return request


class OctoprintPrinter(object):
    def __init__(self, printer):
        self.name = printer["name"]
        self.hostname = printer["hostname"]
        self.ip = printer["ip"]
        self.mac = printer["mac"]
        self.version = printer["version"]
        self.active = printer["active"]

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
