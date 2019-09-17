import unittest

from server.drivers import get_printer_instance
from server.drivers.octoprint import Octoprint

class GetWithFallbackTest(unittest.TestCase):
    def test_throws_on_missing_client(self):
        with self.assertRaises(RuntimeError) as context:
            get_printer_instance({})
            self.assertTrue('no client defined' in str(context.exception))

    def test_throws_on_unknown_client(self):
        with self.assertRaises(RuntimeError) as context:
            get_printer_instance({"client": "unknown"})
            self.assertTrue('unknown client unknown' in str(context.exception))

    def test_returns_octoprint_instance(self):
        octoprinter = get_printer_instance({"client": "octoprint", "hostname": "octoprinter", "ip": "1.2.3.4"})
        self.assertTrue(isinstance(octoprinter, Octoprint))
