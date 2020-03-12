import unittest

from server.clients import get_printer_instance
from server.clients.octoprint import Octoprint
from ..utils import UUID_ORG


class GetWithFallbackTest(unittest.TestCase):
    def test_throws_on_missing_client(self):
        with self.assertRaises(RuntimeError) as context:
            get_printer_instance({})
            self.assertTrue("no client defined" in str(context.exception))

    def test_throws_on_unknown_client(self):
        with self.assertRaises(RuntimeError) as context:
            get_printer_instance({"client": "unknown"})
            self.assertTrue("unknown client unknown" in str(context.exception))

    def test_returns_octoprint_instance(self):
        octoprinter = get_printer_instance(
            {
                "uuid": "20e91c14-c3e4-4fe9-a066-e69d53324a20",
                "network_client_uuid": "900c73b8-1f12-4027-941a-e4b29531e8e3",
                "organization_uuid": UUID_ORG,
                "client": "octoprint",
                "hostname": "octoprinter",
                "host": "1.2.3.4",
            }
        )
        self.assertTrue(isinstance(octoprinter, Octoprint))
