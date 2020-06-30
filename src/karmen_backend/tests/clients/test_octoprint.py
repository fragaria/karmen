import os
import unittest
import pytest
import json
import tempfile
import mock
from requests.exceptions import ConnectionError, ReadTimeout

from server import app
from server.errors import (
    DeviceCommunicationError,
    DeviceInvalidState,
    DeviceNetworkError,
    DeviceNotConnectedError,
)
from server.clients.utils import PrinterClientException, PrinterClientAccessLevel
from server.clients.octoprint import Octoprint
from ..utils import Response, SimpleResponse, UUID_ORG


PRINTER_UUID = "900c73b8-1f12-4027-941a-e4b29531e8e3"
NETWORK_UUID = "d501f4f0-48d5-468e-a137-1f3803cd836c"
PRINTER_IP="192.168.1.15"
PRINTER_PORT=8081
PRINTER_PATH="/some/path"

def makeTestOctoprint(**kwargs):
    args = (PRINTER_UUID, UUID_ORG, NETWORK_UUID)
    base_kwargs = {
        "ip": PRINTER_IP,
        "port": PRINTER_PORT,
        "path": PRINTER_PATH,
    }
    base_kwargs.update(kwargs)
    return Octoprint(*args, **base_kwargs)



class OctoprintConstructor(unittest.TestCase):

    def test_parse_client_props(self):
        client_props = {
            "connected": True,
            "access_level": PrinterClientAccessLevel.PROTECTED,
            "version": {},
        }
        printer = makeTestOctoprint(client_props=client_props)
        client_info = printer.client_info
        self.assertEqual(
            (client_info.access_level, client_info.connected),
            (client_props["access_level"], client_props["connected"]),
        )


class OctoprintIsAliveTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("unable to connect."))
    def test_disconnected_printer(self, mock_get_uri):
        printer = makeTestOctoprint()
        self.assertFalse(printer.client_info.connected)
        self.assertFalse(printer.is_alive())
        self.assertFalse(printer.client_info.connected)

    @mock.patch(
        "server.clients.octoprint.requests.Session.get", return_value=Response(200)
    )
    def test_connected_printer(self, mock_get_uri):
        printer = makeTestOctoprint()
        self.assertFalse(printer.client_info.connected)
        self.assertTrue(printer.is_alive())
        self.assertTrue(printer.client_info.connected)


class OctoprintConnectPrinterTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.post")
    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("unable to connect."))
    def test_disconnected_printer(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint()
        self.assertFalse(printer.connect_printer())
        self.assertEqual(mock_get_uri.call_count, 1, "Current status is checked first")
        self.assertEqual(mock_post_uri.call_count, 0, "'Connect' is not called after invalid status was received.")

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch("server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Closed"}}),
    )
    def test_reachable_disconnected_printer(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        self.assertTrue(printer.connect_printer())

    @mock.patch("server.clients.octoprint.requests.post", side_effect=ConnectionError())
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Offline"}}),
    )
    def test_reachable_offline_printer(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        self.assertFalse(printer.connect_printer())

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_already_connected_printer(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        self.assertTrue(printer.connect_printer())
        self.assertEqual(mock_post_uri.call_count, 0,
            "Printer is not reconnected when it is already Operational")

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_already_connected_printer_on_path(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        self.assertTrue(printer.connect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 0)
        mock_get_uri.call_args[0][0].startswith(f"http://{PRINTER_IP}:{PRINTER_PORT}{PRINTER_PATH}/api/printer")


class OctoprintDisconnectPrinterTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.post", side_effect=ConnectionError("unable to connect."))
    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("unable to connect."))
    def test_disconnected__unreachable_printer(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint()
        self.assertTrue(printer.disconnect_printer())
        mock_get_uri.assert_called_once()
        mock_post_uri.assert_not_called()

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Closed"}}),
    )
    def test_reachable_disconnected_printer(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint()
        self.assertTrue(printer.disconnect_printer())
        mock_get_uri.assert_called_once()
        mock_post_uri.assert_not_called()

    @mock.patch("server.clients.octoprint.requests.post")
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Offline"}}),
    )
    def test_reachable_offline_printer(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        self.assertTrue(printer.disconnect_printer())
        mock_post_uri.assert_not_called() # not called, already offline

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_connected_printer(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        self.assertTrue(printer.disconnect_printer())
        mock_post_uri.assert_called_once()

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(500))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_not_disconnectable_printer(self, mock_get_uri, mock_post_uri):
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        self.assertFalse(printer.disconnect_printer())


class OctoprintSniffTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("unable to connect."))
    def test_deactivate_non_responding_printer(self, mock_get_uri):
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        self.assertTrue(printer.client_info.connected)
        printer.sniff()
        self.assertFalse(printer.client_info.connected)
        self.assertEqual(printer.client_info.version, {})

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_access_protected_octoprint_noforcelogin(self, mock_get_uri):
        def mock_call(uri, **kwargs):
            if "settings" in uri:
                return Response( 200, {
                    "plugins": {"awesome_karmen_led": {"ready": True}}
                })
            else:
                return Response(403)

        mock_get_uri.side_effect = mock_call

        printer = makeTestOctoprint()
        printer.sniff()
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.READ_ONLY
        )
        self.assertEqual(printer.client_info.version, {})
        self.assertTrue("awesome_karmen_led" in printer.client_info.plugins)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_access_protected_not_octoprint(self, mock_get_uri):
        def mock_call(uri, **kwargs):
            return Response(404) if 'settings' in uri else Response(403)

        mock_get_uri.side_effect = mock_call

        printer = makeTestOctoprint()
        printer.sniff()
        self.assertFalse(printer.client_info.connected)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNKNOWN
        )
        self.assertEqual(printer.client_info.version, {})

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_access_protected_octoprint_forcelogin(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 403
        printer = makeTestOctoprint()
        printer.sniff()
        self.assertTrue(printer.client_info.connected)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.PROTECTED
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_deactivate_non_200_responding_printer(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 404
        printer = makeTestOctoprint()
        printer.sniff()
        self.assertFalse(printer.client_info.connected)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNKNOWN
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_deactivate_no_data_responding_printer(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        # FIXME: invalid response from a printer should be reported (logged and
        # stored to a state of the printer)
        mock_get_uri.return_value.json.side_effect = json.decoder.JSONDecodeError(
            "msg", "aa", 123
        )
        printer = makeTestOctoprint()
        printer.sniff()
        self.assertFalse(printer.client_info.connected)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNKNOWN
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_deactivate_bad_data_responding_printer(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {"text": "Fumbleprint"}
        printer = makeTestOctoprint()
        printer.sniff()
        self.assertFalse(printer.client_info.connected)
        self.assertEqual(printer.client_info.version, {"text": "Fumbleprint"})
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNKNOWN
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_activate_responding_printer(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {"text": "OctoPrint"}
        printer = makeTestOctoprint(
            protocol="https",
        )
        printer.sniff()
        self.assertEqual(mock_get_uri.call_count, 3)
        mock_get_uri.assert_any_call(
            f"https://{PRINTER_IP}:{PRINTER_PORT}{PRINTER_PATH}/api/version", timeout=200, verify=True
        )
        mock_get_uri.assert_any_call(
            f"https://{PRINTER_IP}:{PRINTER_PORT}{PRINTER_PATH}/api/settings", timeout=200, verify=True
        )
        self.assertTrue(printer.client_info.connected)



class OctoprintStatusTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_status_ok(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        temperature_value = {
                "bed": {"actual": 49.8, "offset": 0, "target": 50.0},
                "tool0": {"actual": 240.4, "offset": 0, "target": 240.0},
            }
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Printing"},
            "temperature": temperature_value,
        }
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        result = printer.status()
        self.assertEqual(
            result,
            {"state": "Printing", "temperature": temperature_value},
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_status_malformed_json(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.side_effect = json.decoder.JSONDecodeError(
            "msg", "aa", 123
        )
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        result = printer.status()
        self.assertEqual(
            result,
            {"state": "Printer is responding with invalid data", "temperature": {}},
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_status_conflict(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 409
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        result = printer.status()
        self.assertEqual(
            result,
            {"state": "Printer is not connected to Octoprint", "temperature": {}},
        )

    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("unable to connect."))
    def test_status_unreachable(self, mock_get_uri):
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        result = printer.status()
        self.assertEqual(
            result, {"state": "Printer is not responding", "temperature": {}}
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_status_protected(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 403
        printer = makeTestOctoprint(
            client_props={
                "connected": True,
                "api_key": "1234",
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
        )
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNLOCKED
        )
        result = printer.status()
        self.assertEqual(
            result, {"state": "Printer is not responding", "temperature": {}}
        )
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.PROTECTED
        )

class OctoprintWebcamTest(unittest.TestCase):

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_webcam__url(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "webcam": {
                "webcamEnabled": True,
                "flipH": True,
                "flipV": True,
                "rotate90": False,
                "snapshotUrl": "/webcam/?action=snapshot",
                "streamUrl": "http://193.178.1.10/webcam/?action=stream",
            }
        }
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(
            result,
            {
                "message": "OK",
                "flipHorizontal": True,
                "flipVertical": True,
                "rotate90": False,
                "stream": "http://193.178.1.10/webcam/?action=stream",
                "snapshot": f"http://{PRINTER_IP}:{PRINTER_PORT}{PRINTER_PATH}/webcam/?action=snapshot",
            },
        )

    def test_parse_url_missing_protocol(self):
        self.assertEqual(
            makeTestOctoprint()._parse_device_url("1.2.3.4/?action=snapshot"),
            "http://1.2.3.4/?action=snapshot"
        )

    def test_parse_url_missing_protocol_local_url(self):
        self.assertEqual(
            makeTestOctoprint()._parse_device_url("http://127.0.0.1:8080/webcam/?action=snapshot"),
            f"http://{PRINTER_IP}:8080/webcam/?action=snapshot"
        )


    def test_parse_url_local_url_ws_api(self):
        self.assertEqual(
            makeTestOctoprint(token="ws-token")._parse_device_url("http://127.0.0.1/webcam/?action=snapshot"),
            '%s%s' % ((app.config["SOCKET_API_URL"] % "ws-token"), "/webcam/?action=snapshot"),
            "when token is set, device urls translates to websocket proxy host"
        )
        self.assertEqual(
            makeTestOctoprint(token="ws-token")._parse_device_url("/webcam/?action=snapshot"),
            '%s%s' % ((app.config["SOCKET_API_URL"] % "ws-token"), "/webcam/?action=snapshot"),
            "when token is set, device urls translates to websocket proxy host even for url without host specification"
        )

        self.assertEqual(
            makeTestOctoprint(token="ws-token")._parse_device_url("http://127.0.0.1:8888/webcam/?action=snapshot"),
            None,
            "url with port other than 80 cannot be proxied throught websocket proxy",
        )

    def test_parse_url_localhost_url(self):
        self.assertEqual(
            makeTestOctoprint()._parse_device_url("http://localhost:1234/?action=snapshot"),
            f"http://{PRINTER_IP}:1234/?action=snapshot"
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_webcam_disabled(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "webcam": {
                "flipH": True,
                "flipV": True,
                "rotate90": False,
                "streamUrl": "http://1.2.3.4/webcam/?action=stream",
                "webcamEnabled": False,
            }
        }
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(result, {"message": "Webcam disabled in octoprint"})

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_webcam_malformed_json(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.side_effect = json.decoder.JSONDecodeError(
            "msg", "aa", 123
        )
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(result, {"message": "Cannot decode JSON"})

    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("Unable to connect."))
    def test_webcam_no_response(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(result, {"message": "Webcam not accessible"})

    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("Unable to connect."))
    def test_webcam_inactive_printer(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
        )
        self.assertEqual(mock_get_uri.call_count, 0)
        result = printer.webcam()
        self.assertEqual(result, {"message": "Webcam not accessible"})


class OctoprintJobTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_job_ok(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "job": {"file": {"display": "test-pouzdro-na-iphone.gcode"}},
            "progress": {"completion": 12, "printTimeLeft": 35, "printTime": 10},
            "state": "Printing",
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.job()
        self.assertEqual(
            result,
            {
                "name": "test-pouzdro-na-iphone.gcode",
                "completion": 12,
                "printTimeLeft": 35,
                "printTime": 10,
            },
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_job_done(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "job": {"file": {"display": "test-pouzdro-na-iphone.gcode"}},
            "progress": {"completion": 100, "printTimeLeft": 0, "printTime": 10},
            "state": "Operational",
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.job()
        self.assertEqual(result, {})

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_job_offline_printer(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "job": {"file": {"display": "test-pouzdro-na-iphone.gcode"}},
            "progress": {"completion": 100, "printTimeLeft": 0, "printTime": 10},
            "state": "Offline (Error: Too many consecutive timeouts, printer still connected and alive?)",
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.job()
        self.assertEqual(result, {})

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_job_malformed_json(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.side_effect = json.decoder.JSONDecodeError(
            "msg", "aa", 123
        )
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.job()
        self.assertEqual(result, {})

    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("Unable to connect."))
    def test_job_disconnect(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.client_info.connected)
        printer.job()
        self.assertFalse(printer.client_info.connected)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_job_disconnected(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
        )
        printer.job()
        self.assertEqual(mock_get_uri.call_count, 0)

    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("unable to connect."))
    def test_job_no_response(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.job()
        self.assertEqual(result, {})

    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("unable to connect."))
    def test_job_inactive_printer(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
        )
        self.assertEqual(mock_get_uri.call_count, 0)
        result = printer.job()
        self.assertEqual(result, {})


class OctoprintUploadAndStartJobTest(unittest.TestCase):
    def setUp(self):
        self.file_mock = tempfile.NamedTemporaryFile(delete=False)

    def tearDown(self):
        self.file_mock.close()
        os.remove(self.file_mock.name)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post")
    def test_upload_job_ok(self, mock_post_uri, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Operational"},
            "temperature": {},
        }
        mock_post_uri.return_value.status_code = 201
        mock_post_uri.return_value.json.return_value = {
            "files": {
                "local": {
                    "name": "20mm-umlaut-box",
                    "origin": "local",
                    "refs": {
                        "resource": "http://example.com/api/files/local/whistle_v2.gcode",
                        "download": "http://example.com/downloads/files/local/whistle_v2.gcode",
                    },
                }
            },
            "done": True,
        }
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        printer.upload_and_start_job(self.file_mock.name)
        args, kwargs = mock_post_uri.call_args
        self.assertEqual(kwargs["data"], {"path": "karmen", "print": True})
        self.assertEqual(kwargs["files"]["file"].name, self.file_mock.name)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post")
    def test_upload_job_path_ok(self, mock_post_uri, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Operational"},
            "temperature": {},
        }
        mock_post_uri.return_value.status_code = 201
        mock_post_uri.return_value.json.return_value = {
            "files": {
                "local": {
                    "name": "20mm-umlaut-box",
                    "origin": "local",
                    "refs": {
                        "resource": "http://example.com/api/files/local/whistle_v2.gcode",
                        "download": "http://example.com/downloads/files/local/whistle_v2.gcode",
                    },
                }
            },
            "done": True,
        }
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        printer.upload_and_start_job(
            self.file_mock.name, path="sub/path/on/disk"
        )
        kwargs = mock_post_uri.call_args[1]
        self.assertEqual(
            kwargs["data"], {"path": "karmen/sub/path/on/disk", "print": True}
        )
        self.assertEqual(kwargs["files"]["file"].name, self.file_mock.name)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_upload_job_printing(self, mock_post_uri, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Printing"},
            "temperature": {},
        }
        with self.assertRaises(DeviceInvalidState) as context:
            printer = makeTestOctoprint(
                client_props={"connected": True},
            )
            printer.upload_and_start_job(self.file_mock.name)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post", side_effect=ReadTimeout())
    def test_upload_job_upload_crash(self, mock_post_uri, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Operational"},
            "temperature": {},
        }
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        with self.assertRaises(DeviceNetworkError):
            printer.upload_and_start_job(self.file_mock.name)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post")
    def test_upload_job_no_response(self, mock_post_uri, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Operational"},
            "temperature": {},
        }
        printer = makeTestOctoprint(
            client_props={"connected": True},
        )
        with self.assertRaises(DeviceCommunicationError):
            printer.upload_and_start_job(self.file_mock.name)



class OctoprintModifyCurrentJobTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.post")
    def test_modify_job_start_ok(self, mock_post_uri):
        mock_post_uri.return_value.status_code = 204
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.modify_current_job("start")
        self.assertTrue(result)
        args, kwargs = mock_post_uri.call_args
        self.assertEqual(kwargs["json"], {"command": "start"})

    @mock.patch("server.clients.octoprint.requests.post")
    def test_modify_job_cancel_ok(self, mock_post_uri):
        mock_post_uri.return_value.status_code = 204
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.modify_current_job("cancel")
        self.assertTrue(result)
        args, kwargs = mock_post_uri.call_args
        self.assertEqual(kwargs["json"], {"command": "cancel"})

    @mock.patch("server.clients.octoprint.requests.post")
    def test_modify_job_toggle_ok(self, mock_post_uri):
        mock_post_uri.return_value.status_code = 204
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.modify_current_job("toggle")
        self.assertTrue(result)
        args, kwargs = mock_post_uri.call_args
        self.assertEqual(kwargs["json"], {"command": "pause", "action": "toggle"})

    @mock.patch("server.clients.octoprint.requests.post", side_effect=ConnectionError())
    def test_modify_job_disconnect(self, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        printer.modify_current_job("toggle")
        # testing connected = Flase
        self.assertFalse(printer.client_info.connected)  


    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_modify_job_no_response(self, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.modify_current_job("toggle")
        self.assertFalse(result)

    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_modify_job_inactive_printer(self, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
        )
        self.assertEqual(mock_post_uri.call_count, 0)
        result = printer.modify_current_job("toggle")
        self.assertFalse(result)

    def test_unknown_action(self):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        with self.assertRaises(Exception) as ctx:
            printer.modify_current_job("random")

        self.assertTrue("random is not allowed" in str(ctx.exception))


class OctoprintAreLightsOnTest(unittest.TestCase):
    def test_no_plugin(self):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        with self.assertRaises(Exception) as ctx:
            printer.are_lights_on()

        self.assertTrue("awesome_karmen_led is not loaded" in str(ctx.exception))

    @mock.patch("server.clients.octoprint.requests.Session.get", side_effect=ConnectionError("unable to connect."))
    def test_plugin_not_responding(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True, "plugins": ["awesome_karmen_led"]},
        )
        r = printer.are_lights_on()
        self.assertFalse(r)

    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"color": [0, 0, 1]}),
    )
    def test_plugin_responding_not_black(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True, "plugins": ["awesome_karmen_led"]},
        )
        r = printer.are_lights_on()
        self.assertTrue(r)

    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"color": [0, 0, 0]}),
    )
    def test_plugin_responding_black(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True, "plugins": ["awesome_karmen_led"]},
        )
        r = printer.are_lights_on()
        self.assertFalse(r)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_plugin_bad_response(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.side_effect = json.decoder.JSONDecodeError(
            "msg", "aa", 123
        )
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True, "plugins": ["awesome_karmen_led"]},
        )
        r = printer.are_lights_on()
        self.assertFalse(r)


class OctoprintSetLightsTest(unittest.TestCase):
    def test_no_plugin(self):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        with self.assertRaises(Exception) as ctx:
            printer.set_lights()

        self.assertTrue("awesome_karmen_led is not loaded" in str(ctx.exception))

    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_plugin_not_responding(self, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True, "plugins": ["awesome_karmen_led"]},
        )
        r = printer.set_lights()
        self.assertFalse(r)

    @mock.patch(
        "server.clients.octoprint.requests.post",
        return_value=Response(200, {"status": "OK"}),
    )
    def test_plugin_responding(self, mock_post_uri):
        mock_post_uri.return_value.status_code = 200
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True, "plugins": ["awesome_karmen_led"]},
        )
        r = printer.set_lights()
        self.assertTrue(r)
        self.assertEqual(mock_post_uri.call_count, 1)
        args, kwargs = mock_post_uri.call_args
        self.assertEqual(args[0], "http://192.168.1.15/api/plugin/awesome_karmen_led")
        self.assertEqual(kwargs["json"], {"command": "set_led", "color": "black"})

    @mock.patch(
        "server.clients.octoprint.requests.post",
        return_value=Response(200, {"status": "OK"}),
    )
    def test_plugin_pass_data(self, mock_post_uri):
        mock_post_uri.return_value.status_code = 200
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True, "plugins": ["awesome_karmen_led"]},
        )
        r = printer.set_lights(color="red", heartbeat=1)
        self.assertTrue(r)
        self.assertEqual(mock_post_uri.call_count, 1)
        args, kwargs = mock_post_uri.call_args
        self.assertEqual(args[0], "http://192.168.1.15/api/plugin/awesome_karmen_led")
        self.assertEqual(
            kwargs["json"], {"command": "set_led", "color": "red", "heartbeat": 1,}
        )

    @mock.patch("server.clients.octoprint.requests.post")
    def test_plugin_bad_response(self, mock_post_uri):
        mock_post_uri.return_value.status_code = 200
        mock_post_uri.return_value.json.side_effect = json.decoder.JSONDecodeError(
            "msg", "aa", 123
        )
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
            client_props={"connected": True, "plugins": ["awesome_karmen_led"]},
        )
        r = printer.set_lights()
        self.assertFalse(r)


class KarmenSniffPrinterTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.Octoprint._http_get")
    @mock.patch("server.database.props_storage.get_props")
    def test_karmen_sniff_default_pill(self, mock_props, mock_get):
        def mock_call(uri, **kwargs):
            if uri.startswith("/karmen-pill-info/"):
                return Response(
                    200,
                    {
                        "networking": {
                            "mode": "client",
                            "ssid": "Alexa",
                            "has_passphrase": False,
                            "country": "CZ",
                        },
                        "system": {
                            "karmen_version": "0.2.0",
                            "karmen_version_hash": "cdcd7749e47dbaeea6482bd2b745eba4ac6c32ec 0.2.0",
                            "hostname": "kpz-1016",
                            "timezone": "Europe/Prague",
                            "device_key": "206b22a3126644eb8dd73c8e276961c6",
                            "update_status": None,
                        },
                    },
                )

        def get_props(prop):
            if prop == "versions":
                return [
                    {"pattern": r"""0\.2\.[01]""", "new_version_name": "0.2.3"},
                ]

        mock_get.side_effect = mock_call
        mock_props.side_effect = get_props
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
        )
        printer.karmen_sniff()
        self.assertEqual(
            printer.client_info.pill_info,
            {
                "karmen_version": "0.2.0",
                "version_number": "0.2.0",
                "update_available": "0.2.3",
                "update_status": None,
            },
        )

    @mock.patch("server.clients.octoprint.Octoprint._http_get")
    def test_karmen_snif_no_pill(self, mock_get):
        def mock_call(uri, **kwargs):
            if uri.startswith("/karmen-pill-info/"):
                return Response(404, None)

        mock_get.side_effect = mock_call

        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
        )
        printer.karmen_sniff()
        self.assertEqual(printer.client_info.pill_info, None)

    @mock.patch("server.clients.octoprint.Octoprint._http_get")
    @mock.patch("server.clients.octoprint.Octoprint._http_post")
    @mock.patch("server.database.props_storage.get_props")
    def test_karmen_sniff_update_downloading_finished(
        self, mock_props, mock_post, mock_get
    ):
        def mock_call(uri, **kwargs):
            if uri.startswith("/karmen-pill-info/"):
                return Response(
                    200,
                    {
                        "networking": {
                            "mode": "client",
                            "ssid": "Alexa",
                            "has_passphrase": False,
                            "country": "CZ",
                        },
                        "system": {
                            "karmen_version": "0.2.0",
                            "karmen_version_hash": "cdcd7749e47dbaeea6482bd2b745eba4ac6c32ec 0.2.0",
                            "hostname": "kpz-1016",
                            "timezone": "Europe/Prague",
                            "device_key": "206b22a3126644eb8dd73c8e276961c6",
                            "update_status": "downloading",
                        },
                    },
                )

        def mock_call_post(uri, data, **kwargs):
            if uri == "/update-system":
                if data == '{"action": "download-status"}':
                    return SimpleResponse(200, "DONE")

        def get_props(prop):
            if prop == "versions":
                return [
                    {"pattern": r"""0\.2\.[01]""", "new_version_name": "0.2.3"},
                ]

        mock_get.side_effect = mock_call
        mock_post.side_effect = mock_call_post
        mock_props.side_effect = get_props
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
        )
        printer.karmen_sniff()
        self.assertEqual(
            printer.client_info.pill_info,
            {
                "karmen_version": "0.2.0",
                "version_number": "0.2.0",
                "update_available": "0.2.3",
                "update_status": "downloaded",
            },
        )

    @mock.patch("server.clients.octoprint.Octoprint._http_get")
    @mock.patch("server.clients.octoprint.Octoprint._http_post")
    @mock.patch("server.database.props_storage.get_props")
    def test_karmen_sniff_start_update(self, mock_props, mock_post, mock_get):
        def mock_call(uri, **kwargs):
            if uri.startswith("/karmen-pill-info/"):
                return Response(
                    200,
                    {
                        "networking": {
                            "mode": "client",
                            "ssid": "Alexa",
                            "has_passphrase": False,
                            "country": "CZ",
                        },
                        "system": {
                            "karmen_version": "0.2.0",
                            "karmen_version_hash": "cdcd7749e47dbaeea6482bd2b745eba4ac6c32ec 0.2.0",
                            "hostname": "kpz-1016",
                            "timezone": "Europe/Prague",
                            "device_key": "206b22a3126644eb8dd73c8e276961c6",
                            "update_status": "downloaded",
                        },
                    },
                )

        def mock_call_post(path, data, **kwargs):
            if path == "/update-system":
                if data == '{"action": "update-start"}':
                    return SimpleResponse(200, "OK")

        def get_props(prop):
            if prop == "versions":
                return [
                    {"pattern": r"""0\.2\.[01]""", "new_version_name": "0.2.3"},
                ]

        mock_get.side_effect = mock_call
        mock_post.side_effect = mock_call_post
        mock_props.side_effect = get_props
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
        )
        printer.karmen_sniff()
        self.assertEqual(
            printer.client_info.pill_info,
            {
                "karmen_version": "0.2.0",
                "version_number": "0.2.0",
                "update_available": "0.2.3",
                "update_status": "downloaded",
            },
        )
        mock_post.assert_called_with(
            "/update-system",
            **{
                "timeout": 30,
                "force": True,
                "data": '{"action": "update-start"}',
                "headers": {"Content-Type": "application/json"},
            }
        )

    @mock.patch("server.clients.octoprint.Octoprint._http_get")
    @mock.patch("server.clients.octoprint.Octoprint._http_post")
    @mock.patch("server.database.props_storage.get_props")
    def test_karmen_sniff_finished_update(self, mock_props, mock_post, mock_get):
        def mock_call(uri, **kwargs):
            if uri.startswith("/karmen-pill-info/"):
                return Response(
                    200,
                    {
                        "networking": {
                            "mode": "client",
                            "ssid": "Alexa",
                            "has_passphrase": False,
                            "country": "CZ",
                        },
                        "system": {
                            "karmen_version": "0.2.0",
                            "karmen_version_hash": "cdcd7749e47dbaeea6482bd2b745eba4ac6c32ec 0.2.0",
                            "hostname": "kpz-1016",
                            "timezone": "Europe/Prague",
                            "device_key": "206b22a3126644eb8dd73c8e276961c6",
                            "update_status": "done",
                        },
                    },
                )

        def mock_call_post(path, data=None, **kwargs):
            if path == "/update-system":
                if data == '{"action": "update-start"}':
                    return SimpleResponse(200, "OK")

        def get_props(prop):
            if prop == "versions":
                return [
                    {"pattern": r"""0\.2\.[01]""", "new_version_name": "0.2.3"},
                ]

        mock_get.side_effect = mock_call
        mock_post.side_effect = mock_call_post
        mock_props.side_effect = get_props
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            "d501f4f0-48d5-468e-a137-1f3803cd836c",
            UUID_ORG,
            ip="192.168.1.15",
        )
        printer.karmen_sniff()
        self.assertEqual(
            printer.client_info.pill_info,
            {
                "karmen_version": "0.2.0",
                "version_number": "0.2.0",
                "update_available": "0.2.3",
                "update_status": "done",
            },
        )
        mock_post.assert_called_with(
            "/reboot",
            **{
                "timeout": 30,
                "force": True,
                "headers": {"Content-Type": "application/json"},
            }
        )
