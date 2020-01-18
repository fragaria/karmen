import unittest
import mock

from server.tasks.check_printers import check_printers
from server.clients.utils import PrinterClientAccessLevel
from ..utils import Response


class CheckPrintersTest(unittest.TestCase):
    @mock.patch(
        "server.database.printers.get_printers",
        return_value=[
            {
                "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                "hostname": "a",
                "ip": "1234",
                "client_props": {
                    "connected": True,
                    "version": {},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                },
                "client": "octoprint",
                "protocol": "https",
                "printer_props": {"filament_type": "PETG"},
            },
            {
                "uuid": "b2732ff8-605b-4d56-87f3-5a590d672912",
                "hostname": "b",
                "ip": "5678",
                "client_props": {
                    "connected": True,
                    "version": {},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                },
                "client": "octoprint",
            },
        ],
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch(
        "server.tasks.check_printers.network.get_avahi_hostname",
        return_value="router.asus.com",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_deactivate_no_data_responding_printer(
        self, mock_get_data, mock_hostname, mock_update_printer, mock_get_printers,
    ):
        check_printers()
        self.assertEqual(mock_get_printers.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 2)
        self.assertEqual(mock_update_printer.call_count, 2)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                        "hostname": "router.asus.com",
                        "ip": "1234",
                        "port": None,
                        "name": None,
                        "client": "octoprint",
                        "protocol": "https",
                        "client_props": {
                            "connected": False,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": None,
                            "webcam": {"message": "Webcam not accessible"},
                        },
                        "printer_props": {"filament_type": "PETG"},
                    }
                ),
                mock.call(
                    **{
                        "uuid": "b2732ff8-605b-4d56-87f3-5a590d672912",
                        "hostname": "router.asus.com",
                        "ip": "5678",
                        "port": None,
                        "protocol": "http",
                        "name": None,
                        "client": "octoprint",
                        "client_props": {
                            "connected": False,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": None,
                            "webcam": {"message": "Webcam not accessible"},
                        },
                        "printer_props": None,
                    }
                ),
            ]
        )

    @mock.patch(
        "server.database.printers.get_printers",
        return_value=[
            {
                "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                "hostname": "a.local",
                "ip": "1234",
                "client_props": {
                    "connected": False,
                    "version": {},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                    "api_key": "1234",
                    "webcam": {"message": "Webcam disabled in octoprint"},
                },
                "client": "octoprint",
                "protocol": "https",
            },
            {
                "uuid": "b2732ff8-605b-4d56-87f3-5a590d672912",
                "hostname": "b.local",
                "ip": "5678",
                "client_props": {
                    "connected": True,
                    "version": {},
                    "access_level": PrinterClientAccessLevel.READ_ONLY,
                },
                "client": "octoprint",
            },
        ],
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch(
        "server.tasks.check_printers.network.get_avahi_hostname",
        return_value="router.asus.com",
    )
    @mock.patch("server.clients.cachedoctoprint.redisinstance")
    def test_activate_responding_printer(
        self,
        mock_octoprint_redis,
        mock_hostname,
        mock_get_data,
        mock_update_printer,
        mock_get_printers,
    ):
        def mock_call(uri, **kwargs):
            print(uri)
            if "b.local" in uri and "/api/settings" in uri:
                return Response(
                    200,
                    {
                        "webcam": {
                            "webcamEnabled": True,
                            "streamUrl": "/webcam/?action=stream",
                            "flipH": False,
                            "flipV": True,
                            "rotate90": False,
                        }
                    },
                )
            if "a.local" in uri and "/api/version" in uri:
                return Response(200, {"text": "octoprint"})
            return Response(200)

        mock_octoprint_redis.get.return_value = None
        mock_get_data.side_effect = mock_call
        check_printers()
        self.assertEqual(mock_get_printers.call_count, 1)
        self.assertEqual(
            mock_get_data.call_count, 5
        )  # Does an additional sniff request + 2 webcam requests
        self.assertEqual(mock_update_printer.call_count, 2)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                        "hostname": "router.asus.com",
                        "ip": "1234",
                        "port": None,
                        "name": None,
                        "client": "octoprint",
                        "protocol": "https",
                        "client_props": {
                            "connected": True,
                            "version": {"text": "octoprint"},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": "1234",
                            "webcam": {"message": "Webcam disabled in octoprint"},
                        },
                        "printer_props": None,
                    }
                ),
                mock.call(
                    **{
                        "uuid": "b2732ff8-605b-4d56-87f3-5a590d672912",
                        "hostname": "router.asus.com",
                        "ip": "5678",
                        "port": None,
                        "protocol": "http",
                        "name": None,
                        "client": "octoprint",
                        "client_props": {
                            "connected": True,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.READ_ONLY,
                            "api_key": None,
                            "webcam": {
                                "message": "OK",
                                "stream": "http://b.local/webcam/?action=stream",
                                "snapshot": None,
                                "flipHorizontal": False,
                                "flipVertical": True,
                                "rotate90": False,
                            },
                        },
                        "printer_props": None,
                    }
                ),
            ]
        )

    @mock.patch(
        "server.database.printers.get_printers",
        return_value=[
            {
                "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                "hostname": "a",
                "ip": "1234",
                "client_props": {
                    "connected": True,
                    "version": {},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                },
                "client": "octoprint",
                "protocol": "https",
                "printer_props": {"filament_type": "PETG"},
            }
        ],
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch(
        "server.tasks.check_printers.network.get_avahi_hostname",
        return_value="router.asus.com",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_update_hostname(
        self, mock_get_data, mock_hostname, mock_update_printer, mock_get_printers,
    ):
        check_printers()
        self.assertEqual(mock_hostname.call_count, 1)
        self.assertEqual(mock_get_printers.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                        "hostname": "router.asus.com",
                        "ip": "1234",
                        "port": None,
                        "name": None,
                        "client": "octoprint",
                        "protocol": "https",
                        "client_props": {
                            "connected": False,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": None,
                            "webcam": {"message": "Webcam not accessible"},
                        },
                        "printer_props": {"filament_type": "PETG"},
                    }
                )
            ]
        )
