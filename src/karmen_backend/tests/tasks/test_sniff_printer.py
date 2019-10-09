import unittest
from datetime import datetime, timedelta
import mock

from server.tasks.sniff_printer import save_printer_data, sniff_printer

class SavePrinterDataTest(unittest.TestCase):

    @mock.patch('server.database.printers.update_printer')
    @mock.patch('server.database.printers.add_printer')
    @mock.patch('server.database.printers.get_printer', return_value=None)
    def test_not_update_inactive_unknown_printer(self, mock_get_printer, \
        mock_add_printer, mock_update_printer):
        save_printer_data(ip='1.2.3.4', client_props={"connected": False})
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch('server.database.printers.update_printer')
    @mock.patch('server.database.printers.add_printer')
    @mock.patch('server.database.printers.get_printer', return_value=None)
    def test_add_active_unknown_printer(self, mock_get_printer, \
        mock_add_printer, mock_update_printer):
        save_printer_data(ip='1.2.3.4', client_props={"connected": True})
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch('server.database.printers.update_printer')
    @mock.patch('server.database.printers.add_printer')
    @mock.patch('server.database.printers.get_printer', return_value={"name": "1234", "ip": "1.2.3.4."})
    def test_update_any_known_printer(self, mock_get_printer, \
        mock_add_printer, mock_update_printer):
        save_printer_data(ip='1.2.3.4', client_props={"connected": True}, name="1.2.3.4")
        save_printer_data(ip='1.2.3.4', client_props={"connected": False}, name="1.2.3.4")
        self.assertEqual(mock_get_printer.call_count, 2)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 2)
        args, update_kwargs = mock_update_printer.call_args
        # Should not overwrite custom editable name
        self.assertEqual(update_kwargs["name"], "1234")

class SniffPrinterTest(unittest.TestCase):

    @mock.patch('server.database.settings.get_val')
    @mock.patch('server.database.network_devices.upsert_network_device')
    @mock.patch('server.tasks.sniff_printer.save_printer_data')
    @mock.patch('server.drivers.octoprint.get_uri', return_value=None)
    def test_deactivate_no_data_responding_printer(self, mock_get_data, mock_update_printer, mock_upsert, mock_get_val):
        def mock_call(key):
            return 3600
        mock_get_val.side_effect = mock_call
        retry_after_at_least = datetime.utcnow() + timedelta(hours=1)
        sniff_printer('octopi.local', '192.168.1.10')
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_upsert.call_count, 1)
        args, upsert_kwargs = mock_upsert.call_args
        self.assertEqual(upsert_kwargs["ip"], "192.168.1.10")
        self.assertTrue(upsert_kwargs["retry_after"] > retry_after_at_least)
        self.assertFalse(upsert_kwargs["disabled"])
        mock_update_printer.assert_called_with(**{
            "hostname": "octopi.local",
            "ip": "192.168.1.10",
            "name": "octopi.local",
            "client": "octoprint",
            "client_props": {
                "connected": False,
                "version": {},
                "read_only": False,
            },
        })

    @mock.patch('server.database.settings.get_val')
    @mock.patch('server.database.network_devices.upsert_network_device')
    @mock.patch('server.tasks.sniff_printer.save_printer_data')
    @mock.patch('server.drivers.octoprint.get_uri')
    def test_deactivate_bad_data_responding_printer(self, mock_get_data, mock_update_printer, mock_upsert, mock_get_val):
        def mock_call(key):
            return 3600
        mock_get_val.side_effect = mock_call
        mock_get_data.return_value.status_code = 200
        mock_get_data.return_value.json.return_value = {"text": "Fumbleprint"}
        retry_after_at_least = datetime.utcnow() + timedelta(hours=1)
        sniff_printer('octopi.local', '192.168.1.11')
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_upsert.call_count, 1)
        args, upsert_kwargs = mock_upsert.call_args
        self.assertEqual(upsert_kwargs["ip"], "192.168.1.11")
        self.assertTrue(upsert_kwargs["retry_after"] > retry_after_at_least)
        mock_update_printer.assert_called_with(**{
            "hostname": "octopi.local",
            "ip": "192.168.1.11",
            "name": "octopi.local",
            "client": "octoprint",
            "client_props": {
                "connected": False,
                "version": {"text": "Fumbleprint"},
                "read_only": False,
            },
        })

    @mock.patch('server.database.settings.get_val')
    @mock.patch('server.database.network_devices.upsert_network_device')
    @mock.patch('server.tasks.sniff_printer.save_printer_data')
    @mock.patch('server.drivers.octoprint.get_uri')
    def test_activate_responding_printer(self, mock_get_data, mock_update_printer, mock_upsert, mock_get_val):
        def mock_call(key):
            return 3600
        mock_get_val.side_effect = mock_call
        mock_get_data.return_value.status_code = 200
        mock_get_data.return_value.json.return_value = {"text": "OctoPrint"}
        sniff_printer('octopi.local', '192.168.1.12')
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_upsert.call_count, 1)
        mock_upsert.assert_called_with(**{
            "ip": "192.168.1.12",
            "retry_after": None,
            "disabled": False,
        })
        mock_update_printer.assert_called_with(**{
            "hostname": "octopi.local",
            "ip": "192.168.1.12",
            "name": "octopi.local",
            "client": "octoprint",
            "client_props": {
                "connected": True,
                "version": {"text": "OctoPrint"},
                "read_only": False,
            },
        })
