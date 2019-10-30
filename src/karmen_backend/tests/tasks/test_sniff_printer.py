import unittest
import mock

from server.tasks.sniff_printer import save_printer_data, sniff_printer


class Response:
    def __init__(self, status_code, contents=""):
        self.status_code = status_code
        self.contents = contents

    def json(self):
        return self.contents


class SavePrinterDataTest(unittest.TestCase):
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch("server.database.printers.get_printer", return_value=None)
    def test_not_update_inactive_unknown_printer(
        self, mock_get_printer, mock_add_printer, mock_update_printer
    ):
        save_printer_data(host="1.2.3.4", client_props={"connected": False})
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch("server.database.printers.get_printer", return_value=None)
    def test_add_active_unknown_printer(
        self, mock_get_printer, mock_add_printer, mock_update_printer
    ):
        save_printer_data(host="1.2.3.4", client_props={"connected": True})
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch(
        "server.database.printers.get_printer",
        return_value={"name": "1234", "host": "1.2.3.4."},
    )
    def test_update_any_known_printer(
        self, mock_get_printer, mock_add_printer, mock_update_printer
    ):
        save_printer_data(
            host="1.2.3.4", client_props={"connected": True}, name="1.2.3.4"
        )
        save_printer_data(
            host="1.2.3.4", client_props={"connected": False}, name="1.2.3.4"
        )
        self.assertEqual(mock_get_printer.call_count, 2)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 2)
        args, update_kwargs = mock_update_printer.call_args
        # Should not overwrite custom editable name
        self.assertEqual(update_kwargs["name"], "1234")


class SniffPrinterTest(unittest.TestCase):
    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_deactivate_no_data_responding_printer(
        self, mock_get_data, mock_update_printer
    ):
        sniff_printer("octopi.local", "192.168.1.10")
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_deactivate_bad_data_responding_printer(
        self, mock_get_data, mock_update_printer
    ):
        mock_get_data.return_value.status_code = 200
        mock_get_data.return_value.json.return_value = {"text": "Fumbleprint"}
        sniff_printer("octopi.local", "192.168.1.11")
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_activate_responding_printer(self, mock_get_data, mock_update_printer):
        mock_get_data.return_value.status_code = 200
        mock_get_data.return_value.json.return_value = {"text": "OctoPrint"}
        sniff_printer("octopi.local", "192.168.1.12")
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_called_with(
            **{
                "hostname": "octopi.local",
                "host": "192.168.1.12",
                "protocol": "http",
                "name": "octopi.local",
                "client": "octoprint",
                "client_props": {
                    "connected": True,
                    "version": {"text": "OctoPrint"},
                    "read_only": False,
                },
                "printer_props": None,
            }
        )

    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_try_http_and_https(self, mock_get_data, mock_update_printer):
        def mock_call(uri, **kwargs):
            if "https" in uri:
                return Response(200, {"text": "OctoPrint"})
            return None

        mock_get_data.side_effect = mock_call

        sniff_printer("octopi.local", "192.168.1.12")
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 2)
        mock_update_printer.assert_called_with(
            **{
                "hostname": "octopi.local",
                "host": "192.168.1.12",
                "protocol": "https",
                "name": "octopi.local",
                "client": "octoprint",
                "client_props": {
                    "connected": True,
                    "version": {"text": "OctoPrint"},
                    "read_only": False,
                },
                "printer_props": None,
            }
        )
