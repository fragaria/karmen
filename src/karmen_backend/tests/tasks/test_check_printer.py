import unittest
from datetime import datetime
import mock
import pickle

from server.tasks.check_printer import check_printer
from server.database.printers import update_printer
from server.clients.utils import PrinterClientAccessLevel
from ..utils import Response, UUID_ORG


class CheckPrinterTest(unittest.TestCase):
    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "network_client_uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
            "printer_props": {"filament_type": "PETG"},
        },
    )
    @mock.patch(
        "server.database.network_clients.get_network_client",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "hostname": "a",
            "ip": "1234",
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.network_clients.update_network_client")
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
        mock_update_network_client,
        mock_update_printer,
        mock_get_network_client,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_get_network_client.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_update_network_client.call_count, 1)
        self.assertEqual(mock_address.call_count, 1)
        self.assertEqual(mock_hostname.call_count, 1)
        mock_update_printer.assert_any_call(
            **{
                "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                "client_props": {
                    "connected": False,
                    "version": {},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                    "api_key": None,
                    "webcam": {"message": "Webcam not accessible"},
                    "plugins": [],
                    "pill_info": None,
                },
            }
        )
        mock_update_network_client.assert_any_call(
            **{
                "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                "hostname": "router.asus.com",
                "ip": "1234",
            }
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "b2732ff8-605b-4d56-87f3-5a590d672912",
            "organization_uuid": UUID_ORG,
            "network_client_uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "client_props": {
                "connected": False,
                "version": {},
                "access_level": PrinterClientAccessLevel.READ_ONLY,
            },
        },
    )
    @mock.patch(
        "server.database.network_clients.get_network_client",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "hostname": "b.local",
            "ip": "5678",
            "client": "octoprint",
            "protocol": "http",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.network_clients.update_network_client")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname", return_value="b.local",
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="5678",
    )
    @mock.patch("server.clients.cachedoctoprint.redis_client")
    @mock.patch("server.tasks.check_printer.datetime")
    def test_activate_responding_printer(
        self,
        mock_datetime,
        mock_octoprint_redis,
        mock_address,
        mock_hostname,
        mock_get_data,
        mock_update_network_client,
        mock_update_printer,
        mock_get_network_client,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        settings_response = Response(
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

        def mock_call(uri, **kwargs):
            if "5678" in uri and "/api/settings" in uri:
                return settings_response
            return Response(200, {"text": "octoprint"})

        mock_octoprint_redis.get.return_value = pickle.dumps(settings_response)
        mock_get_data.side_effect = mock_call
        check_printer("b2732ff8-605b-4d56-87f3-5a590d672912")
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_address.call_count, 1)
        self.assertEqual(mock_hostname.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 3)
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_update_network_client.call_count, 0)
        mock_update_printer.assert_any_call(
            **{
                "uuid": "b2732ff8-605b-4d56-87f3-5a590d672912",
                "client_props": {
                    "connected": True,
                    "version": {"text": "octoprint"},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                    "api_key": None,
                    "webcam": {
                        "message": "OK",
                        "stream": "http://5678/webcam/?action=stream",
                        "snapshot": None,
                        "flipHorizontal": False,
                        "flipVertical": True,
                        "rotate90": False,
                    },
                    "plugins": [],
                    "pill_info": None,
                },
            }
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "network_client_uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
            "printer_props": {"filament_type": "PETG"},
        },
    )
    @mock.patch(
        "server.database.network_clients.get_network_client",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "ip": "1234",
            "hostname": None,
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.network_clients.update_network_client")
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
        mock_update_network_client,
        mock_update_printer,
        mock_get_network_client,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        mock_update_network_client.assert_any_call(
            **{
                "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                "hostname": "router.asus.com",
                "ip": "1234",
            }
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "network_client_uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
        },
    )
    @mock.patch(
        "server.database.network_clients.get_network_client",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "ip": "1234",
            "hostname": None,
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.network_clients.update_network_client")
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
        mock_update_network_client,
        mock_update_printer,
        mock_get_network_client,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_update_network_client.call_count, 0)

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "network_client_uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
        },
    )
    @mock.patch(
        "server.database.network_clients.get_network_client",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "hostname": "c.local",
            "ip": "1234",
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.network_clients.update_network_client")
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
        mock_update_network_client,
        mock_update_printer,
        mock_get_network_client,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_update_network_client.call_count, 1)
        mock_update_network_client.assert_any_call(
            **{
                "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                "hostname": "c.local",
                "ip": "5678",
            }
        )
        mock_update_printer.assert_any_call(
            **{
                "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                "client_props": {
                    "connected": False,
                    "version": {},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                    "api_key": None,
                    "webcam": {"message": "Webcam not accessible"},
                    "plugins": [],
                    "pill_info": None,
                },
            }
        )

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "network_client_uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
        },
    )
    @mock.patch(
        "server.database.network_clients.get_network_client",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "hostname": "c.local",
            "ip": "1234",
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.network_clients.update_network_client")
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
        mock_update_network_client,
        mock_update_printer,
        mock_get_network_client,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_update_network_client.call_count, 0)

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "network_client_uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
            },
            "printer_props": {"filament_type": "PETG"},
        },
    )
    @mock.patch(
        "server.database.network_clients.get_network_client",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "ip": "1234",
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.network_clients.update_network_client")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname",
        return_value="router.asus.com",
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="5678",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.tasks.check_printer.datetime")
    @mock.patch("server.clients.cachedoctoprint.redis_client")
    def test_call_sniff_periodically(
        self,
        mock_octoprint_redis,
        mock_datetime,
        mock_get_data,
        mock_address,
        mock_hostname,
        mock_update_network_client,
        mock_update_printer,
        mock_get_network_client,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=30)
        mock_octoprint_redis.get.return_value = None

        def mock_call(uri, **kwargs):
            print("=======CALLING: ", uri)
            if "/api/settings" in uri:
                return Response(200, {"plugins": {"aaa": {},}},)
            if "/karmen-pill-info/get" in uri:
                return Response(
                    200,
                    {
                        "system": {
                            "karmen_version": "fb89a94ed5e0bf3b4e30a50e41acc1a19fcc90ee 0.1.0-alpha",
                        }
                    },
                )
            return Response(200, {"text": "octoprint"})

        mock_get_data.side_effect = mock_call
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_hostname.call_count, 1)
        self.assertEqual(mock_address.call_count, 0)
        self.assertEqual(mock_get_printer.call_count, 1)
        any_http_kwargs = {'timeout': mock.ANY}
        mock_get_data.assert_any_call("https://1234/api/version", **any_http_kwargs)
        # sniff
        mock_get_data.assert_any_call("https://1234/api/settings", **any_http_kwargs)
        # webcam, TODO this is not ideal
        mock_get_data.assert_any_call("https://1234/api/settings", **any_http_kwargs)
        self.assertEqual(mock_get_data.call_count, 4)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_any_call(
            **{
                "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
                "client_props": {
                    "connected": True,
                    "version": {"text": "octoprint"},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                    "api_key": None,
                    "webcam": {"message": "Webcam disabled in octoprint"},
                    "plugins": ["aaa"],
                    "pill_info": {
                        "karmen_version": "fb89a94ed5e0bf3b4e30a50e41acc1a19fcc90ee 0.1.0-alpha",
                        "version_number": "0.1.0-alpha",
                        "update_available": None,
                        "update_status": None,
                    },
                },
            }
        )

    """This one is to make sure that during keepalive sniff, when there is no big sniff at the beggining of
    check_printers that kinda normalizes pill_info, we do not fail on  index errors"""

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "network_client_uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
            "client_props": {
                "connected": True,
                "version": {},
                "access_level": PrinterClientAccessLevel.UNLOCKED,
                "pill_info": {
                    "karmen_version": "fb89a94ed5e0bf3b4e30a50e41acc1a19fcc90ee 0.1.0-alpha",
                    "version_number": "0.1.0-alpha",
                    "update_available": None,
                },
            },
            "printer_props": {"filament_type": "PETG"},
        },
    )
    @mock.patch(
        "server.database.network_clients.get_network_client",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "ip": "1234",
            "client": "octoprint",
            "protocol": "https",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.network_clients.update_network_client")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname",
        return_value="router.asus.com",
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="5678",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.tasks.check_printer.datetime")
    @mock.patch("server.clients.cachedoctoprint.redis_client")
    def test_karmen_sniff_no_pill(
        self,
        mock_octoprint_redis,
        mock_datetime,
        mock_get_data,
        mock_address,
        mock_hostname,
        mock_update_network_client,
        mock_update_printer,
        mock_get_network_client,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        mock_octoprint_redis.get.return_value = None

        def mock_call(uri, **kwargs):
            print("=======CALLING: ", uri)
            if "/api/settings" in uri:
                return Response(200, {"plugins": {"aaa": {},}},)
            if "/karmen-pill-info/get" in uri:
                return Response(502,)
            return Response(200, {"text": "octoprint"})

        mock_get_data.side_effect = mock_call

        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_hostname.call_count, 1)
        self.assertEqual(mock_address.call_count, 0)
        self.assertEqual(mock_get_printer.call_count, 1)

        self.assertEqual(mock_get_data.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 1)

    @mock.patch(
        "server.database.printers.get_printer",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "network_client_uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "organization_uuid": UUID_ORG,
        },
    )
    @mock.patch(
        "server.database.network_clients.get_network_client",
        return_value={
            "uuid": "298819f5-0119-4e9b-8191-350d931f7ecf",
            "token": "1234",
            "client": "octoprint",
            "protocol": "",
        },
    )
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.network_clients.update_network_client")
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_hostname", return_value=None,
    )
    @mock.patch(
        "server.tasks.check_printer.network.get_avahi_address", return_value="5678",
    )
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    @mock.patch("server.tasks.check_printer.datetime")
    def test_no_check_network_for_token_based_printers(
        self,
        mock_datetime,
        mock_get_data,
        mock_address,
        mock_hostname,
        mock_update_network_client,
        mock_update_printer,
        mock_get_network_client,
        mock_get_printer,
    ):
        date = datetime.strptime("06 Mar 2020", "%d %b %Y")
        mock_datetime.now.return_value = date.replace(minute=29)
        check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertEqual(mock_address.call_count, 0)
        self.assertEqual(mock_hostname.call_count, 0)

    @mock.patch("server.database.printers.get_printer", return_value=None)
    def test_task_does_not_fail_when_printer_disappeared(self, mock_get_printer):
        "situation when printer was scheduled for update but was removed in the meantime"
        result = check_printer("298819f5-0119-4e9b-8191-350d931f7ecf")
        self.assertIs(result, None)
