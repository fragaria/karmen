import unittest
import mock

from server.tasks.sniff_printer import save_printer_data, sniff_printer
from server.clients.utils import PrinterClientAccessLevel
from ..utils import Response, UUID_ORG


class SavePrinterDataTest(unittest.TestCase):
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch(
        "server.database.printers.get_printer_by_network_props", return_value=None
    )
    def test_not_update_inactive_unknown_printer(
        self, mock_get_printer, mock_add_printer, mock_update_printer
    ):
        save_printer_data(ip="1.2.3.4", client_props={"connected": False})
        self.assertEqual(mock_get_printer.call_count, 0)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch(
        "server.database.printers.get_printer_by_network_props", return_value=None
    )
    def test_add_active_unknown_printer(
        self, mock_get_printer, mock_add_printer, mock_update_printer
    ):
        save_printer_data(ip="1.2.3.4", client_props={"connected": True})
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch(
        "server.database.printers.get_printer_by_network_props",
        return_value={
            "name": "1234",
            "ip": "1.2.3.4.",
            "client_props": {"api_key": "5678"},
        },
    )
    def test_not_update_any_known_printer(
        self, mock_get_printer, mock_add_printer, mock_update_printer
    ):
        save_printer_data(
            ip="1.2.3.4", client_props={"connected": True}, name="1.2.3.4"
        )
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 0)


class SniffPrinterTest(unittest.TestCase):
    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_not_add_no_data_responding_printer(self, mock_get_data, mock_save_printer):
        sniff_printer(UUID_ORG, "octopi.local", "192.168.1.10")
        self.assertEqual(mock_save_printer.call_count, 0)

    @mock.patch("server.clients.cachedoctoprint.redisinstance")
    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_not_add_bad_data_responding_printer(
        self, mock_get_data, mock_save_printer, mock_redis
    ):
        mock_redis.get.return_value = None
        mock_get_data.return_value.status_code = 200
        mock_get_data.return_value.json.return_value = {"text": "Fumbleprint"}
        sniff_printer(UUID_ORG, "octopi.local", "192.168.1.11")
        self.assertEqual(mock_save_printer.call_count, 0)

    @mock.patch("server.tasks.sniff_printer.uuid.uuid4", return_value="1234")
    @mock.patch("server.clients.cachedoctoprint.redisinstance")
    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_add_responding_printer(
        self, mock_get_data, mock_update_printer, mock_redis, mock_uuid
    ):
        mock_get_data.return_value.status_code = 200
        mock_redis.get.return_value = None
        mock_get_data.return_value.json.return_value = {"text": "OctoPrint"}
        sniff_printer(UUID_ORG, "octopi.local", "192.168.1.12")
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_called_with(
            **{
                "uuid": "1234",
                "organization_uuid": UUID_ORG,
                "hostname": "octopi.local",
                "ip": "192.168.1.12",
                "protocol": "http",
                "name": "octopi.local",
                "client": "octoprint",
                "client_props": {
                    "connected": True,
                    "version": {"text": "OctoPrint"},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                    "api_key": None,
                    "webcam": {"message": "Webcam disabled in octoprint"},
                },
                "printer_props": None,
            }
        )

    @mock.patch("server.tasks.sniff_printer.uuid.uuid4", return_value="1234")
    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_try_http_and_https(self, mock_get_data, mock_update_printer, mock_uuid):
        def mock_call(uri, **kwargs):
            print(uri)
            if "https" in uri:
                return Response(200, {"text": "OctoPrint"})
            return None

        mock_get_data.side_effect = mock_call

        sniff_printer(UUID_ORG, "octopi.local", "192.168.1.12")
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 3)
        mock_update_printer.assert_called_with(
            **{
                "uuid": "1234",
                "organization_uuid": UUID_ORG,
                "hostname": "octopi.local",
                "ip": "192.168.1.12",
                "protocol": "https",
                "name": "octopi.local",
                "client": "octoprint",
                "client_props": {
                    "connected": True,
                    "version": {"text": "OctoPrint"},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                    "api_key": None,
                    "webcam": {"message": "Webcam disabled in octoprint"},
                },
                "printer_props": None,
            }
        )
