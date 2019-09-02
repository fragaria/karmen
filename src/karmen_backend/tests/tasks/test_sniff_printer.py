import unittest
import json
import mock
import requests

from server.tasks.sniff_printer import request_network_device, update_printer, sniff_printer

class UpdatePrinter(unittest.TestCase):

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

class RequestNetworkDevice(unittest.TestCase):
    @mock.patch('requests.get')
    def test_try_hostname(self, mock_requests):
        request_network_device('host', '1.2.3.4')
        mock_requests.assert_called_with('http://host/api/version', timeout=2)

    @mock.patch('requests.get')
    def test_try_ip(self, mock_requests):
        request_network_device(None, '1.2.3.4')
        mock_requests.assert_called_with('http://1.2.3.4/api/version', timeout=2)

    @mock.patch('requests.get')
    def test_try_nothing(self, mock_requests):
        request = request_network_device(None, None)
        self.assertEqual(mock_requests.call_count, 0)
        self.assertEqual(request, None)

    @mock.patch('requests.get')
    def test_fallback_ip(self, mock_requests):
        def mock_call(uri, **kwargs):
            if 'host' in uri:
                raise requests.exceptions.ConnectionError('mocked')
            return uri
        mock_requests.side_effect = mock_call
        request = request_network_device('host', '1.2.3.4')
        self.assertEqual(request, 'http://1.2.3.4/api/version')
        self.assertEqual(mock_requests.call_count, 2)
        mock_requests.assert_has_calls([
            mock.call('http://host/api/version', timeout=2),
            mock.call('http://1.2.3.4/api/version', timeout=2)
        ])

    @mock.patch('requests.get')
    def test_no_success(self, mock_requests):
        def mock_call(uri, **kwargs):
            raise requests.exceptions.ConnectionError('mocked')
        mock_requests.side_effect = mock_call
        request = request_network_device('host', '1.2.3.4')
        self.assertEqual(request, None)
        self.assertEqual(mock_requests.call_count, 2)
        mock_requests.assert_has_calls([
            mock.call('http://host/api/version', timeout=2),
            mock.call('http://1.2.3.4/api/version', timeout=2)
        ])

class TouchPrinter(unittest.TestCase):

    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.tasks.sniff_printer.request_network_device', return_value=None)
    def test_deactivate_non_responding_printer(self, mock_request_device, \
        mock_update_printer):
        sniff_printer('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_called_with(**{
            "mac": "34:97:f6:3f:f1:96",
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "active": False
        })

    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.tasks.sniff_printer.request_network_device')
    def test_deactivate_non_200_responding_printer(self, mock_request_device, mock_update_printer):
        mock_request_device.return_value.status_code = 400
        sniff_printer('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_called_with(**{
            "mac": "34:97:f6:3f:f1:96",
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "active": False
        })

    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.tasks.sniff_printer.request_network_device')
    def test_deactivate_no_data_responding_printer(self, mock_request_device, mock_update_printer):
        mock_request_device.return_value.status_code = 200
        mock_request_device.return_value.json.side_effect = json.decoder.JSONDecodeError('msg', 'aa', 123)
        sniff_printer('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_called_with(**{
            "mac": "34:97:f6:3f:f1:96",
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "active": False
        })

    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.tasks.sniff_printer.request_network_device')
    def test_deactivate_bad_data_responding_printer(self, mock_request_device, mock_update_printer):
        mock_request_device.return_value.status_code = 200
        mock_request_device.return_value.json.return_value = {"text": "Fumbleprint"}
        sniff_printer('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_called_with(**{
            "mac": "34:97:f6:3f:f1:96",
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "active": False,
            "version": {"text": "Fumbleprint"}
        })

    @mock.patch('server.tasks.sniff_printer.update_printer')
    @mock.patch('server.tasks.sniff_printer.request_network_device')
    def test_activate_responding_printer(self, mock_request_device, mock_update_printer):
        mock_request_device.return_value.status_code = 200
        mock_request_device.return_value.json.return_value = {"text": "OctoPrint"}
        sniff_printer('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_called_with(**{
            "mac": "34:97:f6:3f:f1:96",
            "hostname": "octopi.local",
            "ip": "192.168.1.15",
            "name": "octopi.local",
            "active": True,
            "version": {"text": "OctoPrint"}
        })
