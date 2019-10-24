from datetime import datetime, timedelta
import unittest
import mock

from server.tasks.scan_network import scan_network


class ScanNetworkTest(unittest.TestCase):
    @mock.patch("server.database.settings.get_val")
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
    def test_enqueue_sniffing(
        self, mock_delay, mock_avahi, mock_arp_scan, mock_get_val
    ):
        def mock_call(key):
            return "wlan0"

        mock_get_val.side_effect = mock_call
        scan_network()
        self.assertEqual(mock_delay.call_count, 2)
        mock_delay.assert_has_calls(
            [
                mock.call("router.asus.com", "172.17.0.2"),
                mock.call("router.asus.com", "192.168.1.1"),
            ]
        )
