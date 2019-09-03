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
        update_printer(mac='aa:bb', active=False)
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch('server.database.update_printer')
    @mock.patch('server.database.add_printer')
    @mock.patch('server.database.get_printer', return_value=None)
    def test_add_active_unknown_printer(self, mock_get_printer, \
        mock_add_printer, mock_update_printer):
        update_printer(mac='aa:bb', active=True)
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch('server.database.update_printer')
    @mock.patch('server.database.add_printer')
    @mock.patch('server.database.get_printer', return_value={"name": "1234", "mac": "aa:bb"})
    def test_update_any_known_printer(self, mock_get_printer, \
        mock_add_printer, mock_update_printer):
        update_printer(mac='aa:bb', active=True)
        update_printer(mac='aa:bb', active=False)
        self.assertEqual(mock_get_printer.call_count, 2)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 2)

class SniffPrinterTest(unittest.TestCase):

    @mock.patch('server.tasks.sniff_printer.database.upsert_network_device')
    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.tasks.sniff_printer.Octoprint.sniff', return_value={"active": False, "version": {}})
    def test_deactivate_no_data_responding_printer(self, mock_sniff, mock_update_printer, mock_upsert):
        retry_after_at_least = datetime.utcnow() + timedelta(hours=1)
        sniff_printer('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_upsert.call_count, 1)
        args, upsert_kwargs = mock_upsert.call_args
        self.assertEqual(upsert_kwargs["ip"], "192.168.1.15")
        self.assertEqual(upsert_kwargs["mac"], "34:97:f6:3f:f1:96")
        self.assertEqual(upsert_kwargs["is_printer"], False)
        self.assertTrue(upsert_kwargs["retry_after"] > retry_after_at_least)
        mock_update_printer.assert_called_with(**{
            "mac": "34:97:f6:3f:f1:96",
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "name": "octopi.local",
            "active": False,
            "version": {},
            "client": "octoprint",
        })

    @mock.patch('server.tasks.sniff_printer.database.upsert_network_device')
    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.tasks.sniff_printer.Octoprint.sniff', return_value={"active": False, "version": {"text": "Fumbleprint"}})
    def test_deactivate_bad_data_responding_printer(self, mock_sniff, mock_update_printer, mock_upsert):
        retry_after_at_least = datetime.utcnow() + timedelta(hours=1)
        sniff_printer('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_upsert.call_count, 1)
        args, upsert_kwargs = mock_upsert.call_args
        self.assertEqual(upsert_kwargs["ip"], "192.168.1.15")
        self.assertEqual(upsert_kwargs["mac"], "34:97:f6:3f:f1:96")
        self.assertEqual(upsert_kwargs["is_printer"], False)
        self.assertTrue(upsert_kwargs["retry_after"] > retry_after_at_least)
        mock_update_printer.assert_called_with(**{
            "mac": "34:97:f6:3f:f1:96",
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "name": "octopi.local",
            "active": False,
            "version": {"text": "Fumbleprint"},
            "client": "octoprint",
        })

    @mock.patch('server.tasks.sniff_printer.database.upsert_network_device')
    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.tasks.sniff_printer.Octoprint.sniff', return_value={"active": True, "version": {"text": "OctoPrint"}})
    def test_activate_responding_printer(self, mock_sniff, mock_update_printer, mock_upsert):
        sniff_printer('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_upsert.call_count, 1)
        mock_upsert.assert_called_with(**{
            "ip": "192.168.1.15",
            "mac": "34:97:f6:3f:f1:96",
            "is_printer": True,
            "retry_after": None,
        })
        mock_update_printer.assert_called_with(**{
            "mac": "34:97:f6:3f:f1:96",
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "name": "octopi.local",
            "active": True,
            "version": {"text": "OctoPrint"},
            "client": "octoprint",
        })
