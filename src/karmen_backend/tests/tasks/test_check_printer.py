import unittest
from datetime import datetime
import mock

from server.tasks.check_printer import check_printer
from server.clients.utils import PrinterClientAccessLevel
from ..utils import Response, UUID_ORG


class CheckPrinterTest(unittest.TestCase):
    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
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
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname",
        return_value="router.asus.com",
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="1234",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    @mock.patch("server.tasks.check_printer.datetime")
    def test_deactivate_no_data_responding_printer(
        self,
        mock_datetime,
        mock_get_data,
        mock_address,
        mock_hostname,
        mock_update_printer,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_address.call_count, 1)
        self.assertEqual(mock_hostname.call_count, 0)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                        "hostname": "a",
                        "ip": "1234",
                        "client_props": {
                            "connected": False,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": None,
                            "webcam": {"message": "Webcam not accessible"},
                            "plugins": [],
                        },
                    }
                ),
            ]
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "b2732ff8-605b-4d56-87f3-5a590d672912",
            "organization_uuid": UUID_ORG,
            "hostname": "b.local",
            "ip": "5678",
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.READ_ONLY,
            },
            "client": "octoprint",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname",
        return_value="router.asus.com",
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="5678",
    )
    @mock.patch("server.clients.cachedoctoprint.redisinstance")
    @mock.patch("server.tasks.check_printer.datetime")
    def test_activate_responding_printer(
        self,
        mock_datetime,
        mock_octoprint_redis,
        mock_address,
        mock_hostname,
        mock_get_data,
        mock_update_printer,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)

        def mock_call(uri, **kwargs):
            if "5678" in uri and "/api/settings" in uri:
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
            return Response(200)

        mock_octoprint_redis.get.return_value = None
        mock_get_data.side_effect = mock_call
        check_printer("b2732ff8-605b-4d56-87f3-5a590d672912")
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_address.call_count, 1)
        self.assertEqual(mock_hostname.call_count, 0)
        self.assertEqual(mock_get_data.call_count, 2)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "b2732ff8-605b-4d56-87f3-5a590d672912",
                        "hostname": "b.local",
                        "ip": "5678",
                        "client_props": {
                            "connected": True,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.READ_ONLY,
                            "api_key": None,
                            "plugins": [],
                            "webcam": {
                                "message": "OK",
                                "stream": "http://5678/webcam/?action=stream",
                                "snapshot": None,
                                "flipHorizontal": False,
                                "flipVertical": True,
                                "rotate90": False,
                            },
                        },
                    }
                ),
            ]
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
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
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname",
        return_value="router.asus.com",
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="5678",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    @mock.patch("server.tasks.check_printer.datetime")
    def test_update_hostname(
        self,
        mock_datetime,
        mock_get_data,
        mock_address,
        mock_hostname,
        mock_update_printer,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_hostname.call_count, 1)
        self.assertEqual(mock_address.call_count, 0)
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                        "hostname": "router.asus.com",
                        "ip": "1234",
                        "client_props": {
                            "connected": False,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": None,
                            "webcam": {"message": "Webcam not accessible"},
                            "plugins": [],
                        },
                    }
                )
            ]
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "ip": "1234",
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname", return_value=None,
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="5678",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    @mock.patch("server.tasks.check_printer.datetime")
    def test_no_update_hostname_if_resolve_fails(
        self,
        mock_datetime,
        mock_get_data,
        mock_address,
        mock_hostname,
        mock_update_printer,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_hostname.call_count, 1)
        self.assertEqual(mock_address.call_count, 0)
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                        "hostname": None,
                        "ip": "1234",
                        "client_props": {
                            "connected": False,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": None,
                            "webcam": {"message": "Webcam not accessible"},
                            "plugins": [],
                        },
                    }
                )
            ]
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "hostname": "c.local",
            "ip": "1234",
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname", return_value="c.local",
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="5678",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    @mock.patch("server.tasks.check_printer.datetime")
    def test_update_ip(
        self,
        mock_datetime,
        mock_get_data,
        mock_address,
        mock_hostname,
        mock_update_printer,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 1)
        self.assertEqual(mock_address.call_count, 1)
        self.assertEqual(mock_hostname.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                        "hostname": "c.local",
                        "ip": "5678",
                        "client_props": {
                            "connected": False,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": None,
                            "webcam": {"message": "Webcam not accessible"},
                            "plugins": [],
                        },
                    }
                )
            ]
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "hostname": "c.local",
            "ip": "1234",
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname", return_value="c.local",
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value=None,
    )
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    @mock.patch("server.tasks.check_printer.datetime")
    def test_no_update_ip_if_resolve_fails(
        self,
        mock_datetime,
        mock_get_data,
        mock_address,
        mock_hostname,
        mock_update_printer,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 1)
        self.assertEqual(mock_address.call_count, 1)
        self.assertEqual(mock_hostname.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                        "hostname": "c.local",
                        "ip": "1234",
                        "client_props": {
                            "connected": False,
                            "version": {},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": None,
                            "webcam": {"message": "Webcam not accessible"},
                            "plugins": [],
                        },
                    }
                )
            ]
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
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
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname",
        return_value="router.asus.com",
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="5678",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.tasks.check_printer.datetime")
    def test_call_sniff_periodically(
        self,
        mock_datetime,
        mock_get_data,
        mock_address,
        mock_hostname,
        mock_update_printer,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=30)

        def mock_call(uri, **kwargs):
            if "/api/settings" in uri:
                return Response(200, {"plugins": {"aaa": {},}},)
            return Response(200, {"text": "octoprint"})

        mock_get_data.side_effect = mock_call
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_hostname.call_count, 1)
        self.assertEqual(mock_address.call_count, 0)
        self.assertEqual(mock_get_printer.call_count, 1)
        mock_get_data.assert_any_call("https://1234/api/version", timeout=2)
        # sniff
        mock_get_data.assert_any_call("https://1234/api/settings", timeout=2)
        # webcam, TODO this is not ideal
        mock_get_data.assert_any_call("https://1234/api/settings", timeout=2)
        self.assertEqual(mock_get_data.call_count, 3)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_has_calls(
            [
                mock.call(
                    **{
                        "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                        "hostname": "router.asus.com",
                        "ip": "1234",
                        "client_props": {
                            "connected": True,
                            "version": {"text": "octoprint"},
                            "access_level": PrinterClientAccessLevel.UNLOCKED,
                            "api_key": None,
                            "webcam": {"message": "Webcam disabled in octoprint"},
                            "plugins": ["aaa"],
                        },
                    }
                )
            ]
        )
