from datetime import datetime, timedelta
import unittest
import mock

from server.tasks.discover_printers import discover_printers

class DiscoverPrintersTest(unittest.TestCase):

    @mock.patch('server.tasks.discover_printers.do_arp_scan', return_value=[])
    @mock.patch('server.tasks.discover_printers.get_printers', return_value=[
        {"hostname": "a", "ip": "1234", "client_props": {"connected": True}},
        {"hostname": "b", "ip": "1234", "client_props": {"connected": False}}
    ])
    @mock.patch('server.tasks.discover_printers.get_network_devices', return_value=[])
    @mock.patch('server.tasks.discover_printers.get_avahi_hostname', return_value='router.asus.com')
    @mock.patch('server.tasks.discover_printers.update_printer')
    @mock.patch('server.tasks.discover_printers.sniff_printer.delay')
    def test_deactivate_unfound_printers(self, mock_delay, mock_update_printer, mock_avahi, \
        mock_db_devices, mock_get_printers, mock_arp_scan):
        discover_printers()
        self.assertEqual(mock_update_printer.call_count, 2)
        mock_update_printer.assert_has_calls([
            mock.call(**{"hostname": "a", "ip": "1234", "client_props": {"connected": False}}),
            mock.call(**{"hostname": "b", "ip": "1234", "client_props": {"connected": False}})
        ])

    @mock.patch('server.tasks.discover_printers.do_arp_scan', return_value=[
        ('172.17.0.2', '06:43:ac:11:00:02'),
        ('192.168.1.1', '34:97:f6:3f:f1:96'),
    ])
    @mock.patch('server.tasks.discover_printers.get_printers', return_value=[
        {"hostname": "a", "ip": "1234", "client_props": {"connected": True}},
    ])
    @mock.patch('server.tasks.discover_printers.get_network_devices', return_value=[])
    @mock.patch('server.tasks.discover_printers.get_avahi_hostname', return_value='router.asus.com')
    @mock.patch('server.tasks.discover_printers.update_printer')
    @mock.patch('server.tasks.discover_printers.sniff_printer.delay')
    def test_complex_case(self, mock_delay, mock_update_printer, mock_avahi, \
        mock_db_devices, mock_get_printers, mock_arp_scan):
        discover_printers()
        self.assertEqual(mock_delay.call_count, 2)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_delay.assert_has_calls([
            mock.call("router.asus.com", "172.17.0.2"),
            mock.call("router.asus.com", "192.168.1.1"),
        ])
        mock_update_printer.assert_has_calls([
            mock.call(**{
                "hostname": "a",
                "ip": "1234",
                "client_props": {"connected": False}
            }),
        ])

    @mock.patch('server.tasks.discover_printers.do_arp_scan', return_value=[
        ('172.17.0.2', '06:43:ac:11:00:02'),
        ('192.168.1.1', '34:97:f6:3f:f1:96'),
    ])
    @mock.patch('server.tasks.discover_printers.get_printers', return_value=[
        {"hostname": "a", "ip": "1234", "client_props": {"connected": True}},
    ])
    @mock.patch('server.tasks.discover_printers.get_network_devices', return_value=[
        {"ip": "172.17.0.2", "client_props": {"connected": True}, "retry_after": datetime.utcnow() + timedelta(hours=1), "disabled": False},
        {"ip": "192.168.1.1", "client_props": {"connected": True}, "retry_after": datetime.utcnow() + timedelta(hours=-1), "disabled": False},
    ])
    @mock.patch('server.tasks.discover_printers.get_avahi_hostname', return_value='router.asus.com')
    @mock.patch('server.tasks.discover_printers.update_printer')
    @mock.patch('server.tasks.discover_printers.sniff_printer.delay')
    def test_skip_device_ip(self, mock_delay, mock_update_printer, mock_avahi, \
        mock_db_devices, mock_get_printers, mock_arp_scan):
        discover_printers()
        self.assertEqual(mock_delay.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_delay.assert_has_calls([
            mock.call("router.asus.com", "192.168.1.1"),
        ])
