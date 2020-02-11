import os
import unittest
import json
import tempfile
import mock

from server.clients.utils import PrinterClientException, PrinterClientAccessLevel
from server.clients.octoprint import Octoprint
from ..utils import Response


class OctoprintConstructor(unittest.TestCase):
    def test_parse_client_props(self):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            hostname="octopi.local",
            client_props={
                "connected": True,
                "access_level": PrinterClientAccessLevel.PROTECTED,
                "version": {},
            },
        )
        self.assertTrue(printer.client_info.connected)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.PROTECTED
        )


class OctoprintIsAliveTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_disconnected_printer(self, mock_get_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        self.assertFalse(printer.client_info.connected)
        self.assertFalse(printer.is_alive())
        self.assertFalse(printer.client_info.connected)
        self.assertEqual(mock_get_uri.call_count, 1)

    @mock.patch(
        "server.clients.octoprint.requests.Session.get", return_value=Response(200)
    )
    def test_connected_printer(self, mock_get_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        self.assertFalse(printer.client_info.connected)
        self.assertTrue(printer.is_alive())
        self.assertTrue(printer.client_info.connected)
        self.assertEqual(mock_get_uri.call_count, 2)

    @mock.patch(
        "server.clients.octoprint.requests.Session.get", return_value=Response(200)
    )
    def test_already_connected_printer(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.client_info.connected)
        self.assertTrue(printer.is_alive())
        self.assertTrue(printer.client_info.connected)
        self.assertEqual(mock_get_uri.call_count, 1)


class OctoprintConnectPrinterTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_disconnected_printer(self, mock_get_uri, mock_post_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        self.assertFalse(printer.connect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 0)

    @mock.patch(
        "server.clients.octoprint.requests.post", return_value=Response(204)
    )
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Closed"}}),
    )
    def test_reachable_disconnected_printer(self, mock_get_uri, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.connect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 1)

    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Offline"}}),
    )
    def test_reachable_offline_printer(self, mock_get_uri, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertFalse(printer.connect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 1)

    @mock.patch(
        "server.clients.octoprint.requests.post", return_value=Response(204)
    )
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_already_connected_printer(self, mock_get_uri, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.connect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 0)


class OctoprintDisconnectPrinterTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_disconnected_printer(self, mock_get_uri, mock_post_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        self.assertTrue(printer.disconnect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 0)

    @mock.patch(
        "server.clients.octoprint.requests.post", return_value=Response(204)
    )
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Closed"}}),
    )
    def test_reachable_disconnected_printer(self, mock_get_uri, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.disconnect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 0)

    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Offline"}}),
    )
    def test_reachable_offline_printer(self, mock_get_uri, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.disconnect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 0)

    @mock.patch(
        "server.clients.octoprint.requests.post", return_value=Response(204)
    )
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_connected_printer(self, mock_get_uri, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.disconnect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 1)

    @mock.patch(
        "server.clients.octoprint.requests.post", return_value=Response(500)
    )
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_not_disconnectable_printer(self, mock_get_uri, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertFalse(printer.disconnect_printer())
        self.assertEqual(mock_get_uri.call_count, 1)
        self.assertEqual(mock_post_uri.call_count, 1)


class OctoprintSniffTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_deactivate_non_responding_printer(self, mock_get_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        self.assertFalse(printer.client_info.connected)
        printer.sniff()
        self.assertEqual(printer.client_info.connected, False)
        self.assertEqual(printer.client_info.version, {})

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_access_protected_octoprint_noforcelogin(self, mock_get_uri):
        def mock_call(uri, **kwargs):
            if "settings" in uri:
                return Response(200)
            return Response(403)

        mock_get_uri.side_effect = mock_call

        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.sniff()
        self.assertEqual(printer.client_info.connected, True)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.READ_ONLY
        )
        self.assertEqual(printer.client_info.version, {})

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_access_protected_not_octoprint(self, mock_get_uri):
        def mock_call(uri, **kwargs):
            if "settings" in uri:
                return Response(404)
            return Response(403)

        mock_get_uri.side_effect = mock_call

        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.sniff()
        self.assertEqual(printer.client_info.connected, False)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNKNOWN
        )
        self.assertEqual(printer.client_info.version, {})

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_access_protected_octoprint_forcelogin(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 403
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.sniff()
        self.assertEqual(printer.client_info.connected, True)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.PROTECTED
        )
        self.assertEqual(printer.client_info.version, {})

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_deactivate_non_200_responding_printer(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 404
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.sniff()
        self.assertEqual(printer.client_info.connected, False)
        self.assertEqual(printer.client_info.version, {})
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNKNOWN
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_deactivate_no_data_responding_printer(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.side_effect = json.decoder.JSONDecodeError(
            "msg", "aa", 123
        )
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.sniff()
        self.assertEqual(printer.client_info.connected, False)
        self.assertEqual(printer.client_info.version, {})
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNKNOWN
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_deactivate_bad_data_responding_printer(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {"text": "Fumbleprint"}
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.sniff()
        self.assertEqual(printer.client_info.connected, False)
        self.assertEqual(printer.client_info.version, {"text": "Fumbleprint"})
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNKNOWN
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_no_crash_on_different_response(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {"random": "field"}
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.sniff()
        self.assertEqual(printer.client_info.connected, False)
        self.assertEqual(printer.client_info.version, {"random": "field"})
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNKNOWN
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_activate_responding_printer(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {"text": "OctoPrint"}
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15", protocol="https"
        )
        printer.sniff()
        mock_get_uri.assert_called_with("https://192.168.1.15/api/version", timeout=2)
        self.assertEqual(printer.client_info.connected, True)
        self.assertEqual(printer.client_info.version, {"text": "OctoPrint"})
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNLOCKED
        )


class OctoprintStatusTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_status_ok(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Printing"},
            "temperature": {
                "bed": {"actual": 49.8, "offset": 0, "target": 50.0},
                "tool0": {"actual": 240.4, "offset": 0, "target": 240.0},
            },
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.status()
        self.assertEqual(
            result,
            {
                "state": "Printing",
                "temperature": {
                    "bed": {"actual": 49.8, "offset": 0, "target": 50.0},
                    "tool0": {"actual": 240.4, "offset": 0, "target": 240.0},
                },
            },
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_status_malformed_json(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.side_effect = json.decoder.JSONDecodeError(
            "msg", "aa", 123
        )
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
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
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.status()
        self.assertEqual(
            result,
            {"state": "Printer is not connected to Octoprint", "temperature": {}},
        )

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_status_unreachable(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.status()
        self.assertEqual(
            result, {"state": "Printer is not responding", "temperature": {}}
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_status_protected(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 403
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
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

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_status_disconnected(self, mock_get_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.status()
        self.assertEqual(mock_get_uri.call_count, 0)


class OctoprintWebcamTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_webcam_no_absolute_url(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "webcam": {
                "bitrate": "5000k",
                "ffmpegPath": "/usr/bin/ffmpeg",
                "ffmpegThreads": 1,
                "flipH": True,
                "flipV": True,
                "rotate90": False,
                "snapshotSslValidation": True,
                "snapshotTimeout": 5,
                "snapshotUrl": "/webcam/?action=snapshot",
                "streamRatio": "4:3",
                "streamTimeout": 5,
                "streamUrl": "/webcam/?action=stream",
                "timelapseEnabled": True,
                "watermark": True,
                "webcamEnabled": True,
            }
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(
            result,
            {
                "message": "OK",
                "stream": "http://192.168.1.15/webcam/?action=stream",
                "snapshot": "http://192.168.1.15/webcam/?action=snapshot",
                "flipHorizontal": True,
                "flipVertical": True,
                "rotate90": False,
            },
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_webcam_absolute_url(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "webcam": {
                "flipH": True,
                "flipV": True,
                "rotate90": False,
                "streamUrl": "http://1.2.3.4/webcam/?action=stream",
                "snapshotUrl": "http://1.2.3.4/?action=snapshot",
                "webcamEnabled": True,
            }
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(
            result,
            {
                "message": "OK",
                "stream": "http://1.2.3.4/webcam/?action=stream",
                "snapshot": "http://1.2.3.4/?action=snapshot",
                "flipHorizontal": True,
                "flipVertical": True,
                "rotate90": False,
            },
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_webcam_snapshot_local_url(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "webcam": {
                "bitrate": "5000k",
                "ffmpegPath": "/usr/bin/ffmpeg",
                "ffmpegThreads": 1,
                "flipH": True,
                "flipV": True,
                "rotate90": False,
                "snapshotSslValidation": True,
                "snapshotTimeout": 5,
                "snapshotUrl": "http://127.0.0.1:8080/webcam/?action=snapshot",
                "streamRatio": "4:3",
                "streamTimeout": 5,
                "streamUrl": "/webcam/?action=stream",
                "timelapseEnabled": True,
                "watermark": True,
                "webcamEnabled": True,
            }
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(
            result,
            {
                "message": "OK",
                "stream": "http://192.168.1.15/webcam/?action=stream",
                "snapshot": "http://192.168.1.15:8080/webcam/?action=snapshot",
                "flipHorizontal": True,
                "flipVertical": True,
                "rotate90": False,
            },
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_webcam_snapshot_local_hostname_url(self, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "webcam": {
                "bitrate": "5000k",
                "ffmpegPath": "/usr/bin/ffmpeg",
                "ffmpegThreads": 1,
                "flipH": True,
                "flipV": True,
                "rotate90": False,
                "snapshotSslValidation": True,
                "snapshotTimeout": 5,
                "snapshotUrl": "http://localhost:8080/?action=snapshot",
                "streamRatio": "4:3",
                "streamTimeout": 5,
                "streamUrl": "/webcam/?action=stream",
                "timelapseEnabled": True,
                "watermark": True,
                "webcamEnabled": True,
            }
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            port=1234,
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(
            result,
            {
                "message": "OK",
                "stream": "http://192.168.1.15:1234/webcam/?action=stream",
                "snapshot": "http://192.168.1.15:8080/?action=snapshot",
                "flipHorizontal": True,
                "flipVertical": True,
                "rotate90": False,
            },
        )

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_webcam_disconnect(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.client_info.connected)
        printer.webcam()
        self.assertFalse(printer.client_info.connected)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_webcam_disconnected(self, mock_get_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.webcam()
        self.assertEqual(mock_get_uri.call_count, 0)

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
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
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
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(result, {"message": "Cannot decode JSON"})

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_webcam_no_response(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.webcam()
        self.assertEqual(result, {"message": "Webcam not accessible"})

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_webcam_inactive_printer(self, mock_get_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
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
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.job()
        self.assertEqual(result, {})

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_job_disconnect(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.client_info.connected)
        printer.job()
        self.assertFalse(printer.client_info.connected)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_job_disconnected(self, mock_get_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        printer.job()
        self.assertEqual(mock_get_uri.call_count, 0)

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_job_no_response(self, mock_get_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.job()
        self.assertEqual(result, {})

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_job_inactive_printer(self, mock_get_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
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
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.upload_and_start_job(self.file_mock.name)
        self.assertTrue(result)
        args, kwargs = mock_post_uri.call_args
        self.assertEqual(kwargs["data"], {"path": "karmen", "print": True})
        self.assertEqual(kwargs["files"]["file"].name, self.file_mock.name)
        self.assertEqual(kwargs["timeout"], 200)

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
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.upload_and_start_job(
            self.file_mock.name, path="sub/path/on/disk"
        )
        self.assertTrue(result)
        args, kwargs = mock_post_uri.call_args
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
        with self.assertRaises(PrinterClientException) as context:
            printer = Octoprint(
                "900c73b8-1f12-4027-941a-e4b29531e8e3",
                ip="192.168.1.15",
                client_props={"connected": True},
            )
            printer.upload_and_start_job(self.file_mock.name)
        self.assertTrue("Printer is printing" in str(context.exception))

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_upload_job_disconnect(self, mock_post_uri, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Operational"},
            "temperature": {},
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.client_info.connected)
        result = printer.upload_and_start_job(self.file_mock.name)
        self.assertFalse(result)
        self.assertFalse(printer.client_info.connected)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post")
    def test_upload_job_disconnect(self, mock_post_uri, mock_get_uri):
        mock_post_uri.return_value.status_code = 200
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Operational"},
            "temperature": {},
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={
                "connected": True,
                "api_key": "1234",
                "access_level": PrinterClientAccessLevel.PROTECTED,
            },
        )
        self.assertTrue(printer.client_info.connected)
        result = printer.upload_and_start_job(self.file_mock.name)
        self.assertFalse(result)
        self.assertTrue(printer.client_info.connected)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.UNLOCKED
        )

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post")
    def test_upload_job_disconnected(self, mock_post_uri, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Operational"},
            "temperature": {},
        }
        printer = Octoprint("192.168.1.15")
        result = printer.upload_and_start_job(self.file_mock.name)
        self.assertEqual(mock_post_uri.call_count, 0)
        self.assertFalse(result)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_upload_job_no_response(self, mock_post_uri, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {
            "state": {"text": "Operational"},
            "temperature": {},
        }
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.upload_and_start_job(self.file_mock.name)
        self.assertFalse(result)

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_upload_job_inactive_printer(self, mock_post_uri, mock_get_uri):
        printer = Octoprint("192.168.1.15")
        self.assertEqual(mock_post_uri.call_count, 0)
        result = printer.upload_and_start_job(self.file_mock.name)
        self.assertFalse(result)

    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.octoprint.requests.post")
    def test_upload_job_no_api_access(self, mock_post_uri, mock_get_uri):
        mock_get_uri.return_value.status_code = 200
        mock_get_uri.return_value.json.return_value = {"state": {"text": "Operational"}}
        mock_post_uri.return_value.status_code = 403
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={
                "connected": True,
                "api_key": "1234",
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
        )
        self.assertEqual(mock_post_uri.call_count, 0)
        result = printer.upload_and_start_job(self.file_mock.name)
        self.assertFalse(result)
        self.assertEqual(
            printer.client_info.access_level, PrinterClientAccessLevel.PROTECTED
        )


class OctoprintModifyCurrentJobTest(unittest.TestCase):
    @mock.patch("server.clients.octoprint.requests.post")
    def test_modify_job_start_ok(self, mock_post_uri):
        mock_post_uri.return_value.status_code = 204
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
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
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.modify_current_job("toggle")
        self.assertTrue(result)
        args, kwargs = mock_post_uri.call_args
        self.assertEqual(kwargs["json"], {"command": "pause", "action": "toggle"})

    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_modify_job_disconnect(self, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        self.assertTrue(printer.client_info.connected)
        result = printer.modify_current_job("toggle")
        self.assertFalse(result)
        self.assertFalse(printer.client_info.connected)

    @mock.patch("server.clients.octoprint.requests.post")
    def test_modify_job_disconnected(self, mock_post_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        result = printer.modify_current_job("toggle")
        self.assertEqual(mock_post_uri.call_count, 0)
        self.assertFalse(result)

    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_modify_job_no_response(self, mock_post_uri):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        result = printer.modify_current_job("toggle")
        self.assertFalse(result)

    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_modify_job_inactive_printer(self, mock_post_uri):
        printer = Octoprint("900c73b8-1f12-4027-941a-e4b29531e8e3", ip="192.168.1.15")
        self.assertEqual(mock_post_uri.call_count, 0)
        result = printer.modify_current_job("toggle")
        self.assertFalse(result)

    def test_unknown_actino(self):
        printer = Octoprint(
            "900c73b8-1f12-4027-941a-e4b29531e8e3",
            ip="192.168.1.15",
            client_props={"connected": True},
        )
        with self.assertRaises(Exception) as ctx:
            printer.modify_current_job("random")

        self.assertTrue("random is not allowed" in str(ctx.exception))
