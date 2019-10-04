import json
import re

from server import app
from server.services.network import get_uri, post_uri
from server.drivers.utils import PrinterClientInfo, PrinterDriver

# Works with octoprint 1.3.11 without access control
class Octoprint(PrinterDriver):
    __client_name__ = 'octoprint'

    def __init__(self, ip, hostname=None, name=None, client=PrinterClientInfo(), client_props=None):
        self.name = name
        self.hostname = hostname
        self.ip = ip
        if not client_props:
            self.client = client if isinstance(client, PrinterClientInfo) else PrinterClientInfo()
        else:
            self.client = PrinterClientInfo(client_props.get("version", None), client_props.get("connected", False), client_props.get("read_only", False))

    def client_name(self):
        return self.__client_name__

    def is_alive(self):
        request = get_uri(self.ip, endpoint='/api/version')
        # TODO test for access-protected octoprint
        if request is None or request.status_code != 200:
            self.client.connected = False
        else:
            if not self.client.connected:
                self.sniff()
                self.client.connected = True
        return self.client.connected

    # TODO move this code outside of this driver, the sniffing code should discover a variety of drivers
    def sniff(self):
        request = get_uri(self.ip, endpoint='/api/version')
        if request is None:
            app.logger.debug('%s is not responding on /api/version - not octoprint' % self.ip)
            self.client = PrinterClientInfo({}, False)
            return
        if request.status_code == 403:
            app.logger.debug('%s is responding with %s on /api/version - might be access-protected octoprint' % (self.ip, request.status_code))
            settings_req = get_uri(self.ip, endpoint='/api/settings')
            if settings_req and settings_req.status_code == 200:
                app.logger.debug('%s is responding with 200 on /api/settings - probably access-protected octoprint' % self.ip)
                self.client = PrinterClientInfo({}, True, True)
            else:
                app.logger.debug('%s is responding with %s on /api/settings - probably not octoprint' % (self.ip, settings_req.status_code))
                self.client = PrinterClientInfo({}, False)
            return
        if request.status_code != 200:
            app.logger.debug('%s is responding with %s on /api/version - not accessible' % (self.ip, request.status_code))
            self.client = PrinterClientInfo({}, False)
            return
        try:
            data = request.json()
            if "text" not in data:
                app.logger.debug('%s is responding with unfamiliar JSON %s on /api/version - probably not octoprint' % (self.ip, data))
                self.client = PrinterClientInfo(data, False)
                return
        except json.decoder.JSONDecodeError:
            app.logger.debug('%s is not responding with JSON on /api/version - probably not octoprint' % self.ip)
            self.client = PrinterClientInfo({}, False)
            return
        if re.match(r'^octoprint', data["text"], re.IGNORECASE) is None:
            app.logger.debug('%s is responding with %s on /api/version - probably not octoprint' % (self.ip, data["text"]))
            self.client = PrinterClientInfo(data, False)
            return
        self.client = PrinterClientInfo(data, True)

    def status(self):
        request = None
        if self.client.connected:
            request = get_uri(self.ip, endpoint='/api/printer?exclude=history')
            if not request:
                self.client.connected = False
        if request is not None and request.status_code == 200:
            try:
                data = request.json()
                return {
                    "state": data["state"]["text"],
                    "temperature": data["temperature"],
                }
            except json.decoder.JSONDecodeError:
                return {
                    "state": "Printer is responding with invalid data",
                    "temperature": {},
                }
        elif request is not None and request.status_code == 409:
            return {
                "state": "Printer is not connected to Octoprint",
                "temperature": {},
            }
        else:
            return {
                "state": "Printer is not responding",
                "temperature": {},
            }

    def webcam(self):
        request = None
        if self.client.connected:
            request = get_uri(self.ip, endpoint='/api/settings')
            if not request:
                self.client.connected = False
        if request is not None and request.status_code == 200:
            try:
                data = request.json()
                self.client.connected = True
                if "webcam" not in data or not data["webcam"]["webcamEnabled"]:
                    return {}
                stream_url = data["webcam"]["streamUrl"]
                if re.match(r'^https?', stream_url, re.IGNORECASE) is None:
                    # TODO reflect eventual HTTPS
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

    def job(self):
        request = None
        if self.client.connected:
            request = get_uri(self.ip, endpoint='/api/job')
            if not request:
                self.client.connected = False
        if request is not None and request.status_code == 200:
            try:
                data = request.json()
                self.client.connected = True
                if "state" in data and re.match(r"Operational|Offline", data["state"]):
                    return {}
                return {
                    "name": data["job"]["file"]["display"],
                    "completion": data["progress"]["completion"],
                    "printTimeLeft": data["progress"]["printTimeLeft"],
                    "printTime": data["progress"]["printTime"],
                }
            except json.decoder.JSONDecodeError:
                return {}
        else:
            return {}

    def upload_and_start_job(self, gcode_path):
        request = None
        print(self.client.connected)
        if self.client.connected:
            request = post_uri(self.ip, endpoint='/api/files/local', files={
                "file": open(gcode_path, 'rb')
            }, data={
                "path": "karmen",
                "print": True,
            })
            if not request:
                self.client.connected = False
        # TODO improve return value
        return bool(request is not None and request.status_code == 201)

    def modify_current_job(self, action):
        if action not in ('cancel', 'start', 'toggle'):
            raise Exception("Action %s is not allowed" % (action,))
        request = None
        if self.client.connected:
            body = {
                "command": action
            }
            if action == 'toggle':
                body = {
                    "command": "pause",
                    "action": "toggle",
                }
            request = post_uri(self.ip, endpoint='/api/job', json=body)
            if not request:
                self.client.connected = False
        # TODO improve return value
        return bool(request is not None and request.status_code == 204)
