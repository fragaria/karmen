import unittest
import mock

from server.tasks.scan_network import scan_network
from ..utils import UUID_ORG


class ScanNetworkTest(unittest.TestCase):
    @mock.patch(
        "server.tasks.scan_network.do_arp_scan",
        return_value=[
            ("172.17.0.2", "06:43:ac:11:00:02"),
            ("192.168.1.1", "34:97:f6:3f:f1:96"),
        ],
    )
    @mock.patch(
        "server.tasks.scan_network.get_avahi_hostname", return_value="router.asus.com"
    )
    @mock.patch("server.tasks.scan_network.sniff_printer.delay")
    def test_enqueue_sniffing(self, mock_delay, mock_avahi, mock_arp_scan):
        scan_network(UUID_ORG, "wlp4s0")
        self.assertEqual(mock_delay.call_count, 2)
        mock_delay.assert_has_calls(
            [
                mock.call(UUID_ORG, "router.asus.com", "172.17.0.2"),
                mock.call(UUID_ORG, "router.asus.com", "192.168.1.1"),
            ]
        )
