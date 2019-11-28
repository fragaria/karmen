import os
import unittest
import tempfile
import mock

from server.services.network import do_arp_scan, get_avahi_hostname, get_avahi_address


class DoArpScanTest(unittest.TestCase):
    # https://blog.samuel.domains/blog/programming/how-to-mock
    # -stdout-runtime-attribute-of-subprocess-popen-python
    def setUp(self):
        self.stdout_mock = tempfile.NamedTemporaryFile(delete=False)
        self.stderr_mock = tempfile.NamedTemporaryFile(delete=False)

    def tearDown(self):
        self.stdout_mock.close()
        os.remove(self.stdout_mock.name)
        self.stderr_mock.close()
        os.remove(self.stderr_mock.name)

    @mock.patch("subprocess.Popen")
    def test_drop_useless_line(self, mock_popen):
        self.stdout_mock.write(
            b"""
Interface: wlp4s0, datalink type: EN10MB (Ethernet)
Starting arp-scan 1.9 with 256 hosts (http://www.nta-monitor.com/tools/arp-scan/)
10.192.202.1\t54:a0:50:e4:89:c0
10.192.202.4\tb8:27:eb:05:5d:d1
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        self.assertEqual(len(do_arp_scan("wlp4s0")), 2)

    @mock.patch("subprocess.Popen")
    def test_parse_lines(self, mock_popen):
        self.stdout_mock.write(
            b"""
Interface: wlp4s0, datalink type: EN10MB (Ethernet)
Starting arp-scan 1.9 with 256 hosts (http://www.nta-monitor.com/tools/arp-scan/)
10.192.202.1\t54:a0:50:e4:89:c0
10.192.202.4\tb8:27:eb:05:5d:d1
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        self.assertEqual(len(do_arp_scan("wlp4s0")), 2)

    @mock.patch("subprocess.Popen")
    def test_pass_network_interface(self, mock_popen):
        self.stdout_mock.write(
            b"""
Interface: wlp4s0, datalink type: EN10MB (Ethernet)
Starting arp-scan 1.9 with 256 hosts (http://www.nta-monitor.com/tools/arp-scan/)
10.192.202.1\t54:a0:50:e4:89:c0
10.192.202.4\tb8:27:eb:05:5d:d1
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        do_arp_scan("networkiface")
        mock_popen.assert_called_with(
            ["arp-scan", "--interface", "networkiface", "--localnet", "-q"],
            stdout=-1,
            stderr=-1,
        )

    @mock.patch("subprocess.Popen")
    def test_regex(self, mock_popen):
        self.stdout_mock.write(
            b"""
Interface: wlp4s0, datalink type: EN10MB (Ethernet)
Starting arp-scan 1.9 with 256 hosts (http://www.nta-monitor.com/tools/arp-scan/)
10.192.202.1\t54:a0:50:e4:89:c0
10.192.202.4\tb8:27:eb:05:5d:d1
17 packets received by filter, 0 packets dropped by kernel
Ending arp-scan 1.9: 256 hosts scanned in 2.443 seconds (104.79 hosts/sec). 17 responded
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        results = do_arp_scan("networkiface")
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0], ("10.192.202.1", "54:a0:50:e4:89:c0"))
        self.assertEqual(results[1], ("10.192.202.4", "b8:27:eb:05:5d:d1"))

    @mock.patch("server.services.network.app.logger.error")
    @mock.patch("subprocess.Popen")
    def test_err(self, mock_popen, mock_logger):
        self.stderr_mock.write(
            b"""
ioctl: No such device
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        results = do_arp_scan("networkiface")
        self.assertEqual(len(results), 0)
        self.assertTrue(mock_logger.call_count, 1)
        mock_logger.called_with("arp-scan error: ioctl: No such device")


class GetAvahiHostnameTest(unittest.TestCase):
    # https://blog.samuel.domains/blog/programming/how-to-mock
    # -stdout-runtime-attribute-of-subprocess-popen-python
    def setUp(self):
        self.stdout_mock = tempfile.NamedTemporaryFile(delete=False)
        self.stderr_mock = tempfile.NamedTemporaryFile(delete=False)

    def tearDown(self):
        self.stdout_mock.close()
        os.remove(self.stdout_mock.name)
        self.stderr_mock.close()
        os.remove(self.stderr_mock.name)

    @mock.patch("subprocess.Popen")
    def test_drop_error_message(self, mock_popen):
        self.stdout_mock.write(
            b"""
Failed to resolve address '10.192.202.200': Timeout reached
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        self.assertEqual(get_avahi_hostname("10.192.202.200"), None)

    @mock.patch("subprocess.Popen")
    def test_regex(self, mock_popen):
        self.stdout_mock.write(
            b"""
10.192.202.23\toctopi.local
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        result = get_avahi_hostname("10.192.202.23")
        self.assertEqual(result, "octopi.local")

    @mock.patch("subprocess.Popen")
    def test_pass_ip_address(self, mock_popen):
        self.stdout_mock.write(
            b"""
10.192.202.23\toctopi.local
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        get_avahi_hostname("10.192.202.23")
        mock_popen.assert_called_with(
            ["avahi-resolve-address", "10.192.202.23"], stdout=-1, stderr=-1
        )

    @mock.patch("server.services.network.app.logger.error")
    @mock.patch("subprocess.Popen")
    def test_err(self, mock_popen, mock_logger):
        self.stderr_mock.write(
            b"""
Failed to create client object: Daemon not running
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        get_avahi_hostname("10.192.202.23")
        self.assertTrue(mock_logger.call_count, 1)
        mock_logger.called_with(
            "avahi-resolve-address error: Failed to create client object: Daemon not running"
        )


class GetAvahiAddressTest(unittest.TestCase):
    def setUp(self):
        self.stdout_mock = tempfile.NamedTemporaryFile(delete=False)
        self.stderr_mock = tempfile.NamedTemporaryFile(delete=False)

    def tearDown(self):
        self.stdout_mock.close()
        os.remove(self.stdout_mock.name)
        self.stderr_mock.close()
        os.remove(self.stderr_mock.name)

    @mock.patch("subprocess.Popen")
    def test_drop_error_message(self, mock_popen):
        self.stdout_mock.write(
            b"""
Failed to resolve host name 'octopi.local': Timeout reached
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        self.assertEqual(get_avahi_address("octopi.local"), None)

    @mock.patch("subprocess.Popen")
    def test_regex(self, mock_popen):
        self.stdout_mock.write(
            b"""
octopi.local\t10.192.202.23
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        result = get_avahi_address("octopi.local")
        self.assertEqual(result, "10.192.202.23")

    @mock.patch("subprocess.Popen")
    def test_pass_hostname(self, mock_popen):
        self.stdout_mock.write(
            b"""
octopi.local\t10.192.202.23
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        get_avahi_address("octopi.local")
        mock_popen.assert_called_with(
            ["avahi-resolve-host-name", "-4", "octopi.local"], stdout=-1, stderr=-1
        )

    @mock.patch("server.services.network.app.logger.error")
    @mock.patch("subprocess.Popen")
    def test_err(self, mock_popen, mock_logger):
        self.stderr_mock.write(
            b"""
Failed to create client object: Daemon not running
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        get_avahi_address("octopi.local")
        self.assertTrue(mock_logger.call_count, 1)
        mock_logger.called_with(
            "avahi-resolve-host-name error: Failed to create client object: Daemon not running"
        )

    @mock.patch("subprocess.Popen")
    def test_mac_addr_on_first_try(self, mock_popen):
        self.stdout_mock.write(
            b"""
octopi.local fe80::1015:d815:253e:f8e5
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
        self.stderr_mock.seek(0)
        mock_popen.return_value.stderr = self.stderr_mock
        self.assertEqual(get_avahi_address("octopi.local"), None)
