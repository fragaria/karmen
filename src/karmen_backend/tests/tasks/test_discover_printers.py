import os
import unittest
import tempfile
import mock

from server.tasks.discover_printers import get_network_devices, get_avahi_hostname, \
    discover_printers

class GetNetworkDevices(unittest.TestCase):
    # https://blog.samuel.domains/blog/programming/how-to-mock
    # -stdout-runtime-attribute-of-subprocess-popen-python
    def setUp(self):
        self.stdout_mock = tempfile.NamedTemporaryFile(delete=False)

    def tearDown(self):
        self.stdout_mock.close()
        os.remove(self.stdout_mock.name)

    @mock.patch('subprocess.Popen')
    def test_drop_useless_line(self, mock_popen):
        self.stdout_mock.write(b"""
Interface: wlp4s0, datalink type: EN10MB (Ethernet)
Starting arp-scan 1.9 with 256 hosts (http://www.nta-monitor.com/tools/arp-scan/)
10.192.202.1\t54:a0:50:e4:89:c0
10.192.202.4\tb8:27:eb:05:5d:d1
""")
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.assertEqual(len(get_network_devices('wlp4s0')), 2)

    @mock.patch('subprocess.Popen')
    def test_parse_lines(self, mock_popen):
        self.stdout_mock.write(b"""
Interface: wlp4s0, datalink type: EN10MB (Ethernet)
Starting arp-scan 1.9 with 256 hosts (http://www.nta-monitor.com/tools/arp-scan/)
10.192.202.1\t54:a0:50:e4:89:c0
10.192.202.4\tb8:27:eb:05:5d:d1
""")
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.assertEqual(len(get_network_devices('wlp4s0')), 2)

    @mock.patch('subprocess.Popen')
    def test_pass_network_interface(self, mock_popen):
        self.stdout_mock.write(b"""
Interface: wlp4s0, datalink type: EN10MB (Ethernet)
Starting arp-scan 1.9 with 256 hosts (http://www.nta-monitor.com/tools/arp-scan/)
10.192.202.1\t54:a0:50:e4:89:c0
10.192.202.4\tb8:27:eb:05:5d:d1
""")
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        get_network_devices('networkiface')
        mock_popen.assert_called_with(["arp-scan", "--interface", "networkiface", "--localnet", "-q"], stdout=-1)

    @mock.patch('subprocess.Popen')
    def test_regex(self, mock_popen):
        self.stdout_mock.write(b"""
Interface: wlp4s0, datalink type: EN10MB (Ethernet)
Starting arp-scan 1.9 with 256 hosts (http://www.nta-monitor.com/tools/arp-scan/)
10.192.202.1\t54:a0:50:e4:89:c0
10.192.202.4\tb8:27:eb:05:5d:d1
17 packets received by filter, 0 packets dropped by kernel
Ending arp-scan 1.9: 256 hosts scanned in 2.443 seconds (104.79 hosts/sec). 17 responded
""")
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        results = get_network_devices('networkiface')
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0], ('10.192.202.1', '54:a0:50:e4:89:c0'))
        self.assertEqual(results[1], ('10.192.202.4', 'b8:27:eb:05:5d:d1'))


class GetAvahiHostname(unittest.TestCase):
    # https://blog.samuel.domains/blog/programming/how-to-mock
    # -stdout-runtime-attribute-of-subprocess-popen-python
    def setUp(self):
        self.stdout_mock = tempfile.NamedTemporaryFile(delete=False)

    def tearDown(self):
        self.stdout_mock.close()
        os.remove(self.stdout_mock.name)

    @mock.patch('subprocess.Popen')
    def test_drop_error_message(self, mock_popen):
        self.stdout_mock.write(b"""
Failed to resolve address '10.192.202.200': Timeout reached
""")
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.assertEqual(get_avahi_hostname('10.192.202.200'), None)

    @mock.patch('subprocess.Popen')
    def test_regex(self, mock_popen):
        self.stdout_mock.write(b"""
10.192.202.23\toctopi.local
""")
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        result = get_avahi_hostname('10.192.202.23')
        self.assertEqual(result, 'octopi.local')

    @mock.patch('subprocess.Popen')
    def test_pass_ip_address(self, mock_popen):
        self.stdout_mock.write(b"""
10.192.202.23\toctopi.local
""")
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        get_avahi_hostname('10.192.202.23')
        mock_popen.assert_called_with(["avahi-resolve-address", "10.192.202.23"], stdout=-1)

class DiscoverPrinters(unittest.TestCase):

    @mock.patch('server.tasks.discover_printers.get_network_devices', return_value=[])
    @mock.patch('server.database.get_printers', return_value=[
        {"mac": "1", "hostname": "a", "ip": "1234", "active": True},
        {"mac": "2", "hostname": "b", "ip": "1234", "active": False}
    ])
    @mock.patch('server.tasks.discover_printers.get_avahi_hostname', return_value='router.asus.com')
    @mock.patch('server.tasks.discover_printers.update_printer')
    @mock.patch('server.tasks.discover_printers.sniff_printer.delay')
    def test_deactivate_unfound_printers(self, mock_delay, mock_update_printer, mock_avahi, \
        mock_get_printers, mock_get_devices):
        discover_printers()
        self.assertEqual(mock_update_printer.call_count, 2)
        mock_update_printer.assert_has_calls([
            mock.call(**{"mac": "1", "hostname": "a", "ip": "1234", "active": False}),
            mock.call(**{"mac": "2", "hostname": "b", "ip": "1234", "active": False})
        ])

    @mock.patch('server.tasks.discover_printers.get_network_devices', return_value=[
        ('172.17.0.2', '06:43:ac:11:00:02'),
        ('192.168.1.1', '34:97:f6:3f:f1:96'),
    ])
    @mock.patch('server.database.get_printers', return_value=[
        {"mac": "1:2:3", "hostname": "a", "ip": "1234", "active": True},
    ])
    @mock.patch('server.tasks.discover_printers.get_avahi_hostname', return_value='router.asus.com')
    @mock.patch('server.tasks.discover_printers.update_printer')
    @mock.patch('server.tasks.discover_printers.sniff_printer.delay')
    def test_complex_case(self, mock_delay, mock_update_printer, mock_avahi, \
        mock_get_printers, mock_get_devices):
        discover_printers()
        self.assertEqual(mock_delay.call_count, 2)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_delay.assert_has_calls([
            mock.call("router.asus.com", "172.17.0.2", "06:43:ac:11:00:02"),
            mock.call("router.asus.com", "192.168.1.1", "34:97:f6:3f:f1:96"),
        ])
        mock_update_printer.assert_has_calls([
            mock.call(**{
                "mac": "1:2:3",
                "hostname": "a",
                "ip": "1234",
                "active": False
            }),
        ])
