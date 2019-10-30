import json
import re
from urllib import parse as urlparse
import requests

from server import app
from server.clients.utils import (
    PrinterClientInfo,
    PrinterClient,
    PrinterClientException,
)

# Works with octoprint 1.3.11 without access control
class Octoprint(PrinterClient):
    __client_name__ = "octoprint"

    def __init__(
        self,
        host,
        hostname=None,
        name=None,
        client=PrinterClientInfo(),
        client_props=None,
        printer_props=None,
        protocol="http",
    ):
        self.name = name
        self.hostname = hostname
        self.host = host
        self.protocol = protocol
        self.printer_props = printer_props
        if not client_props:
            self.client = (
                client if isinstance(client, PrinterClientInfo) else PrinterClientInfo()
            )
        else:
            self.client = PrinterClientInfo(
                client_props.get("version", None),
                client_props.get("connected", False),
                client_props.get("read_only", False),
                client_props.get("protected", False),
            )
        self.http_session = requests.Session()
        self.http_session.timeout = app.config.get("NETWORK_TIMEOUT", 10)
        self.http_session.verify = app.config.get("NETWORK_VERIFY_CERTIFICATES", True)
        # if client_props.api_key: self.http_session.headers.update({X-Api-Key: client_props.api_key})

    def get_printer_props(self):
        return self.printer_props

    def client_name(self):
        return self.__client_name__

    def _http_get(self, path):
        uri = urlparse.urljoin("%s://%s" % (self.protocol, self.host), path)
        try:
            return self.http_session.get(uri)
        except (
            requests.exceptions.ConnectionError,
            requests.exceptions.ReadTimeout,
        ) as e:
            app.logger.debug("Cannot call %s because %s" % (uri, e))
            return None

    def _http_post(self, path, data=None, files=None, json=None):
        uri = urlparse.urljoin("%s://%s" % (self.protocol, self.host), path)
        try:
            return self.http_session.post(uri, data=data, files=files, json=json)
        except (
            requests.exceptions.ConnectionError,
            requests.exceptions.ReadTimeout,
        ) as e:
            app.logger.debug("Cannot call %s because %s" % (uri, e))
            return None

    def is_alive(self):
        request = self._http_get("/api/version")
        if request is None or request.status_code not in [200, 403]:
            self.client.connected = False
        else:
            if not self.client.connected:
                self.sniff()
                self.client.connected = True
        return self.client.connected

    def connect_printer(self):
        state_check = self.status()
        # printer is offline, it should be safe to do a connect attempt
        if state_check and state_check["state"] in [
            "Offline",
            "Closed",
            "Printer is not connected to Octoprint",
        ]:
            request = self._http_post("/api/connection", json={"command": "connect"})
            # TODO improve return value
            return bool(request is not None and request.status_code == 204)
        # printer is probably connected and operational/printing/etc.
        elif state_check and state_check["state"] not in [
            "Offline",
            "Closed",
            "Printer is not connected to Octoprint",
            "Printer is not responding",
        ]:
            return True
        return False

    def disconnect_printer(self):
        state_check = self.status()
        # printer is offline, it should be safe to do a connect attempt
        if state_check and state_check["state"] not in [
            "Offline",
            "Closed",
            "Printer is not responding",
            "Printer is not connected to Octoprint",
        ]:
            request = self._http_post("/api/connection", json={"command": "disconnect"})
            # TODO improve return value
            return bool(request is not None and request.status_code == 204)
        # printer is probably connected and operational/printing/etc.
        return True

    def sniff(self):
        """
        This can detect whether octoprint is alive and how it's access control is set up.
        In the future, this could detect different versions of octoprint as well.
        """
        request = self._http_get("/api/version")
        if request is None:
            app.logger.debug(
                "%s is not responding on /api/version - not octoprint" % self.host
            )
            self.client = PrinterClientInfo({}, False)
            return
        # This looks like octoprint with access control enabled
        if request.status_code == 403:
            app.logger.debug(
                "%s is responding with %s on /api/version - might be access-protected octoprint"
                % (self.host, request.status_code)
            )
            settings_req = request = self._http_get("/api/settings")
            # This might break with the future versions of octoprint
            # settings responds 200 when forcelogin plugin is disabled, but 403 when forcelogin is enabled
            if settings_req is not None and settings_req.status_code in [200, 403]:
                app.logger.debug(
                    "%s is responding with %s on /api/settings - probably access-protected octoprint"
                    % (self.host, settings_req.status_code)
                )
                self.client = PrinterClientInfo(
                    {},
                    connected=True,
                    read_only=settings_req.status_code == 200,
                    protected=True,
                )
            else:
                app.logger.debug(
                    "%s is responding with %s on /api/settings - probably not octoprint"
                    % (self.host, settings_req.status_code)
                )
                self.client = PrinterClientInfo({}, False)
            return
        # /api/version is not responding at all, which is weird
        if request.status_code != 200:
            app.logger.debug(
                "%s is responding with %s on /api/version - not accessible"
                % (self.host, request.status_code)
            )
            self.client = PrinterClientInfo({}, False)
            return
        # Try to parse /api/version response
        try:
            data = request.json()
            if "text" not in data:
                app.logger.debug(
                    "%s is responding with unfamiliar JSON %s on /api/version - probably not octoprint"
                    % (self.host, data)
                )
                self.client = PrinterClientInfo(data, False)
                return
        except json.decoder.JSONDecodeError:
            app.logger.debug(
                "%s is not responding with JSON on /api/version - probably not octoprint"
                % self.host
            )
            self.client = PrinterClientInfo({}, False)
            return
        if re.match(r"^octoprint", data["text"], re.IGNORECASE) is None:
            app.logger.debug(
                "%s is responding with %s on /api/version - probably not octoprint"
                % (self.host, data["text"])
            )
            self.client = PrinterClientInfo(data, False)
            return
        self.client = PrinterClientInfo(data, True)

    def status(self):
        request = None
        if self.client.connected:
            request = request = self._http_get("/api/printer?exclude=history")
            if not request:
                self.client.connected = False
        if request is not None and request.status_code == 200:
            try:
                data = request.json()
                return {
                    "state": data["state"]["text"],
                    "temperature": data.get("temperature", {}),
                }
            except json.decoder.JSONDecodeError:
                return {
                    "state": "Printer is responding with invalid data",
                    "temperature": {},
                }
        elif request is not None and request.status_code == 409:
            return {"state": "Printer is not connected to Octoprint", "temperature": {}}
        else:
            return {"state": "Printer is not responding", "temperature": {}}

    def webcam(self):
        request = None
        if self.client.connected:
            request = request = self._http_get("/api/settings")
            if not request:
                self.client.connected = False
        if request is not None and request.status_code == 200:
            try:
                data = request.json()
                self.client.connected = True
                if "webcam" not in data or not data["webcam"]["webcamEnabled"]:
                    return {"message": "Stream disabled in octoprint"}
                stream_url = data["webcam"]["streamUrl"]
                if re.match(r"^https?", stream_url, re.IGNORECASE) is None:
                    stream_url = "%s://%s%s" % (self.protocol, self.host, stream_url)
                return {
                    "message": "OK",
                    "stream": stream_url,
                    "flipHorizontal": data["webcam"]["flipH"],
                    "flipVertical": data["webcam"]["flipV"],
                    "rotate90": data["webcam"]["rotate90"],
                }
            except json.decoder.JSONDecodeError:
                return {"message": "Cannot decode JSON"}
        else:
            return {"message": "Stream not accessible"}

    def job(self):
        request = None
        if self.client.connected:
            request = request = self._http_get("/api/job")
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

    def upload_and_start_job(self, gcode_disk_path, path=None):
        request = None
        if self.client.connected:
            status = self.status()
            if status["state"] != "Operational":
                raise PrinterClientException(
                    "Printer is printing, cannot start another print"
                )
            request = self._http_post(
                "/api/files/local",
                files={"file": open(gcode_disk_path, "rb")},
                data={
                    "path": "karmen" if not path else "karmen/%s" % path,
                    "print": True,
                },
            )
            if not request:
                self.client.connected = False
        # TODO improve return value
        return bool(request is not None and request.status_code == 201)

    def modify_current_job(self, action):
        if action not in ("cancel", "start", "toggle"):
            raise PrinterClientException("Action %s is not allowed" % (action,))
        request = None
        if self.client.connected:
            body = {"command": action}
            if action == "toggle":
                body = {"command": "pause", "action": "toggle"}
            request = self._http_post("/api/job", json=body)
            if not request:
                self.client.connected = False
        # TODO improve return value
        return bool(request is not None and request.status_code == 204)
