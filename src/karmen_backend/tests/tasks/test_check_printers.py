import unittest
import mock

from server.tasks.check_printers import check_printers
from server.clients.utils import PrinterClientAccessLevel
from ..utils import Response, UUID_ORG


class CheckPrintersTest(unittest.TestCase):
    @mock.patch(
        "server.database.printers.get_printers",
        return_value=[
            {"uuid": "b2732ff8-605b-4d56-87f3-5a590d672912",},
            {"uuid": "719cc90c-abdd-4299-9c9a-142d61c50ca1",},
        ],
    )
    @mock.patch("server.tasks.check_printers.check_printer.delay")
    def test_call_all_printers(
        self, mock_delay, mock_get_printers,
    ):
        check_printers()
        self.assertEqual(mock_delay.call_count, 2)
