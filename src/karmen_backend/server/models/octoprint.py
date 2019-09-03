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

class Octoprint():
    client = 'octoprint'
    def __init__(self, hostname, ip, mac, name=None, client=None, version=None, active=False):
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
            if "text" not in data:
                app.logger.debug('%s (%s) is responding with unfamiliar JSON %s on /api/version - probably not octoprint' % (self.hostname, self.ip, data))
                return {"active": False, "version": data}
        except json.decoder.JSONDecodeError:
            app.logger.debug('%s (%s) is not responding with JSON on /api/version - probably not octoprint' % (self.hostname, self.ip))
            return {"active": False, "version": {}}
        if re.match(r'^octoprint', data["text"], re.IGNORECASE) is None:
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
                return {
                    "status": "Printer is responding with invalid data",
                    "temperature": {},
                }
        elif request is not None and request.status_code == 409:
            return {
                "status": "Printer is not connected to Octoprint",
                "temperature": {},
            }
        else:
            return {
                "status": "Printer is not responding",
                "temperature": {},
            }

    def webcam(self):
        request = get_with_fallback('/api/settings', self.hostname, self.ip)
        if request is not None and request.status_code == 200:
            try:
                data = request.json()
                stream_url = data["webcam"]["streamUrl"]
                if re.match(r'^https?', stream_url, re.IGNORECASE) is None:
                    stream_url = 'http://%s%s' % (self.ip, stream_url)
                return {
                    "stream": stream_url,
                    "flipHorizontal": data["webcam"]["flipH"],
                    "flipVertical": data["webcam"]["flipV"],
                    "rotate90": data["webcam"]["rotate90"],
                }
            except json.decoder.JSONDecodeError:
                return {}
        else:
            return {}
