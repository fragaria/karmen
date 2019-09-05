import unittest
from datetime import datetime, timedelta
import mock

from server.tasks.sniff_printer import update_printer, sniff_printer

class UpdatePrinterTest(unittest.TestCase):

    @mock.patch('server.database.update_printer')
    @mock.patch('server.database.add_printer')
    @mock.patch('server.database.get_printer', return_value=None)
    def test_not_update_inactive_unknown_printer(self, mock_get_printer, \
        mock_add_printer, mock_update_printer):
        update_printer(ip='1.2.3.4', client_props={"connected": False})
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch('server.database.update_printer')
    @mock.patch('server.database.add_printer')
    @mock.patch('server.database.get_printer', return_value=None)
    def test_add_active_unknown_printer(self, mock_get_printer, \
        mock_add_printer, mock_update_printer):
        update_printer(ip='1.2.3.4', client_props={"connected": True})
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch('server.database.update_printer')
    @mock.patch('server.database.add_printer')
    @mock.patch('server.database.get_printer', return_value={"name": "1234", "ip": "1.2.3.4."})
    def test_update_any_known_printer(self, mock_get_printer, \
        mock_add_printer, mock_update_printer):
        update_printer(ip='1.2.3.4', client_props={"connected": True})
        update_printer(ip='1.2.3.4', client_props={"connected": False})
        self.assertEqual(mock_get_printer.call_count, 2)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 2)

class SniffPrinterTest(unittest.TestCase):

    @mock.patch('server.tasks.sniff_printer.database.upsert_network_device')
    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.models.octoprint.get_with_fallback', return_value=None)
    def test_deactivate_no_data_responding_printer(self, mock_get_data, mock_update_printer, mock_upsert):
        retry_after_at_least = datetime.utcnow() + timedelta(hours=1)
        sniff_printer('octopi.local', '192.168.1.15')
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_upsert.call_count, 1)
        args, upsert_kwargs = mock_upsert.call_args
        self.assertEqual(upsert_kwargs["ip"], "192.168.1.15")
        self.assertTrue(upsert_kwargs["retry_after"] > retry_after_at_least)
        self.assertFalse(upsert_kwargs["disabled"])
        mock_update_printer.assert_called_with(**{
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "name": "octopi.local",
            "client": "octoprint",
            "client_props": {
                "connected": False,
                "version": {},
                "read_only": False,
            },
        })

    @mock.patch('server.tasks.sniff_printer.database.upsert_network_device')
    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_deactivate_bad_data_responding_printer(self, mock_get_data, mock_update_printer, mock_upsert):
        mock_get_data.return_value.status_code = 200
        mock_get_data.return_value.json.return_value = {"text": "Fumbleprint"}
        retry_after_at_least = datetime.utcnow() + timedelta(hours=1)
        sniff_printer('octopi.local', '192.168.1.15')
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_upsert.call_count, 1)
        args, upsert_kwargs = mock_upsert.call_args
        self.assertEqual(upsert_kwargs["ip"], "192.168.1.15")
        self.assertTrue(upsert_kwargs["retry_after"] > retry_after_at_least)
        mock_update_printer.assert_called_with(**{
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "name": "octopi.local",
            "client": "octoprint",
            "client_props": {
                "connected": False,
                "version": {"text": "Fumbleprint"},
                "read_only": False,
            },
        })

    @mock.patch('server.tasks.sniff_printer.database.upsert_network_device')
    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_activate_responding_printer(self, mock_get_data, mock_update_printer, mock_upsert):
        mock_get_data.return_value.status_code = 200
        mock_get_data.return_value.json.return_value = {"text": "OctoPrint"}
        sniff_printer('octopi.local', '192.168.1.15')
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_upsert.call_count, 1)
        mock_upsert.assert_called_with(**{
            "ip": "192.168.1.15",
            "retry_after": None,
            "disabled": False,
        })
        mock_update_printer.assert_called_with(**{
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "name": "octopi.local",
            "client": "octoprint",
            "client_props": {
                "connected": True,
                "version": {"text": "OctoPrint"},
                "read_only": False,
            },
        })
