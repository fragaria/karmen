import os
import unittest
import tempfile
import mock
import requests

from server.services.network import do_arp_scan, get_avahi_hostname, get_uri, post_uri


class DoArpScanTest(unittest.TestCase):
    # https://blog.samuel.domains/blog/programming/how-to-mock
    # -stdout-runtime-attribute-of-subprocess-popen-python
    def setUp(self):
        self.stdout_mock = tempfile.NamedTemporaryFile(delete=False)

    def tearDown(self):
        self.stdout_mock.close()
        os.remove(self.stdout_mock.name)

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
        do_arp_scan("networkiface")
        mock_popen.assert_called_with(
            ["arp-scan", "--interface", "networkiface", "--localnet", "-q"], stdout=-1
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
        results = do_arp_scan("networkiface")
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0], ("10.192.202.1", "54:a0:50:e4:89:c0"))
        self.assertEqual(results[1], ("10.192.202.4", "b8:27:eb:05:5d:d1"))


class GetAvahiHostnameTest(unittest.TestCase):
    # https://blog.samuel.domains/blog/programming/how-to-mock
    # -stdout-runtime-attribute-of-subprocess-popen-python
    def setUp(self):
        self.stdout_mock = tempfile.NamedTemporaryFile(delete=False)

    def tearDown(self):
        self.stdout_mock.close()
        os.remove(self.stdout_mock.name)

    @mock.patch("subprocess.Popen")
    def test_drop_error_message(self, mock_popen):
        self.stdout_mock.write(
            b"""
Failed to resolve address '10.192.202.200': Timeout reached
"""
        )
        self.stdout_mock.seek(0)
        mock_popen.return_value.stdout = self.stdout_mock
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
        get_avahi_hostname("10.192.202.23")
        mock_popen.assert_called_with(
            ["avahi-resolve-address", "10.192.202.23"], stdout=-1
        )


class GetUriTest(unittest.TestCase):
    @mock.patch("requests.get")
    def test_try_hostname(self, mock_requests):
        get_uri("1.2.3.4", "/api/version")
        mock_requests.assert_called_with(
            "http://1.2.3.4/api/version", timeout=2, verify=True
        )

    @mock.patch("requests.get")
    def test_pass_protocol_timeout(self, mock_requests):
        get_uri("1.2.3.4", "/api/version", protocol="https", timeout=3)
        mock_requests.assert_called_with(
            "https://1.2.3.4/api/version", timeout=3, verify=True
        )

    @mock.patch("requests.get")
    def test_add_leading_slash(self, mock_requests):
        get_uri("1.2.3.4", "api/version")
        mock_requests.assert_called_with(
            "http://1.2.3.4/api/version", timeout=2, verify=True
        )

    @mock.patch("requests.get")
    def test_ip_port(self, mock_requests):
        get_uri("1.2.3.4:5000", "api/version")
        mock_requests.assert_called_with(
            "http://1.2.3.4:5000/api/version", timeout=2, verify=True
        )

    @mock.patch("requests.get")
    def test_try_nothing(self, mock_requests):
        request = get_uri(None, "/api/version")
        self.assertEqual(mock_requests.call_count, 0)
        self.assertEqual(request, None)

    @mock.patch("requests.get")
    def test_try_root(self, mock_requests):
        request = get_uri("1.2.3.4")
        mock_requests.assert_called_with("http://1.2.3.4/", timeout=2, verify=True)

    @mock.patch("requests.get")
    def test_no_success(self, mock_requests):
        def mock_call(uri, **kwargs):
            raise requests.exceptions.ConnectionError("mocked")

        mock_requests.side_effect = mock_call
        request = get_uri("1.2.3.4", "/api/version")
        self.assertEqual(request, None)
        self.assertEqual(mock_requests.call_count, 1)
        mock_requests.assert_has_calls(
            [mock.call("http://1.2.3.4/api/version", timeout=2, verify=True)]
        )


class PostUriTest(unittest.TestCase):
    def setUp(self):
        self.file_mock = tempfile.NamedTemporaryFile(delete=False)

    def tearDown(self):
        self.file_mock.close()
        os.remove(self.file_mock.name)

    @mock.patch("requests.post")
    def test_try_hostname(self, mock_requests):
        post_uri("1.2.3.4", "/api/version")
        mock_requests.assert_called_with(
            "http://1.2.3.4/api/version",
            timeout=2,
            data=None,
            files=None,
            json=None,
            verify=True,
        )

    @mock.patch("requests.post")
    def test_pass_protocol_timeout(self, mock_requests):
        post_uri("1.2.3.4", "/api/version", protocol="https", timeout=3)
        mock_requests.assert_called_with(
            "https://1.2.3.4/api/version",
            timeout=3,
            data=None,
            files=None,
            json=None,
            verify=True,
        )

    @mock.patch("requests.post")
    def test_add_leading_slash(self, mock_requests):
        post_uri("1.2.3.4", "api/version")
        mock_requests.assert_called_with(
            "http://1.2.3.4/api/version",
            timeout=2,
            data=None,
            files=None,
            json=None,
            verify=True,
        )

    @mock.patch("requests.post")
    def test_ip_port(self, mock_requests):
        post_uri("1.2.3.4:5000", "api/version")
        mock_requests.assert_called_with(
            "http://1.2.3.4:5000/api/version",
            timeout=2,
            data=None,
            files=None,
            json=None,
            verify=True,
        )

    @mock.patch("requests.post")
    def test_try_nothing(self, mock_requests):
        request = post_uri(None, "/api/version")
        self.assertEqual(mock_requests.call_count, 0)
        self.assertEqual(request, None)

    @mock.patch("requests.post")
    def test_try_root(self, mock_requests):
        post_uri("1.2.3.4")
        mock_requests.assert_called_with(
            "http://1.2.3.4/", timeout=2, data=None, files=None, json=None, verify=True
        )

    @mock.patch("requests.post")
    def test_no_success(self, mock_requests):
        def mock_call(uri, **kwargs):
            raise requests.exceptions.ConnectionError("mocked")

        mock_requests.side_effect = mock_call
        request = post_uri("1.2.3.4", "/api/version")
        self.assertEqual(request, None)
        self.assertEqual(mock_requests.call_count, 1)
        mock_requests.assert_has_calls(
            [
                mock.call(
                    "http://1.2.3.4/api/version",
                    timeout=2,
                    data=None,
                    files=None,
                    json=None,
                    verify=True,
                )
            ]
        )

    @mock.patch("requests.post")
    def test_pass_files_data(self, mock_requests):
        post_uri("1.2.3.4", files=self.file_mock, data={"some": "data"})
        mock_requests.assert_called_with(
            "http://1.2.3.4/",
            timeout=2,
            data={"some": "data"},
            files=self.file_mock,
            json=None,
            verify=True,
        )

    @mock.patch("requests.post")
    def test_pass_json(self, mock_requests):
        post_uri("1.2.3.4", json={"some": "data"})
        mock_requests.assert_called_with(
            "http://1.2.3.4/",
            timeout=2,
            data=None,
            files=None,
            json={"some": "data"},
            verify=True,
        )

    @mock.patch("requests.post")
    def test_no_pass_data_json(self, mock_requests):
        with self.assertRaises(Exception) as ctx:
            post_uri("1.2.3.4", json={"some": "data"}, data={"more": "data"})

        self.assertTrue(
            "Cannot pass json and data/files at the same time" in str(ctx.exception)
        )

    @mock.patch("requests.post")
    def test_no_pass_files_json(self, mock_requests):
        with self.assertRaises(Exception) as ctx:
            post_uri("1.2.3.4", json={"some": "data"}, files=self.file_mock)

        self.assertTrue(
            "Cannot pass json and data/files at the same time" in str(ctx.exception)
        )
