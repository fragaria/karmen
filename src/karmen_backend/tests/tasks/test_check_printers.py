import unittest
import mock

from server.tasks.check_printers import check_printers

class CheckPrintersTest(unittest.TestCase):

    @mock.patch('server.tasks.check_printers.get_printers', return_value=[
        {"hostname": "a", "ip": "1234", "client_props": {"connected": True, "version": {}, "read_only": False}, "client": "octoprint"},
        {"hostname": "b", "ip": "5678", "client_props": {"connected": True, "version": {}, "read_only": False}, "client": "octoprint"}
    ])
    @mock.patch('server.tasks.check_printers.update_printer')
    @mock.patch('server.models.octoprint.get_uri', return_value=None)
    def test_deactivate_no_data_responding_printer(self, mock_get_data, mock_update_printer, mock_get_printers):
        check_printers()
        self.assertEqual(mock_get_printers.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 2)
        self.assertEqual(mock_update_printer.call_count, 2)
        mock_update_printer.assert_has_calls([
            mock.call(**{
                "hostname": "a",
                "ip": "1234",
                "name": None,
                "client": "octoprint",
                "client_props": {
                    "connected": False,
                    "version": {},
                    "read_only": False,
                },
            }),
            mock.call(**{
                "hostname": "b",
                "ip": "5678",
                "name": None,
                "client": "octoprint",
                "client_props": {
                    "connected": False,
                    "version": {},
                    "read_only": False,
                },
            })
        ])

    @mock.patch('server.tasks.check_printers.get_printers', return_value=[
        {"hostname": "a", "ip": "1234", "client_props": {"connected": False, "version": {}, "read_only": False}, "client": "octoprint"},
        {"hostname": "b", "ip": "5678", "client_props": {"connected": True, "version": {}, "read_only": False}, "client": "octoprint"}
    ])
    @mock.patch('server.tasks.check_printers.update_printer')
    @mock.patch('server.models.octoprint.get_uri')
    def test_activate_no_data_responding_printer(self, mock_get_data, mock_update_printer, mock_get_printers):
        class Response():
            def __init__(self, status_code, contents):
                self.status_code = status_code
                self.contents = contents
            def json(self):
                return {}
        def mock_call(uri, **kwargs):
            return Response(200, '')
        mock_get_data.side_effect = mock_call
        check_printers()
        self.assertEqual(mock_get_printers.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 3) # Does an additional sniff request
        self.assertEqual(mock_update_printer.call_count, 2)
        mock_update_printer.assert_has_calls([
            mock.call(**{
                "hostname": "a",
                "ip": "1234",
                "name": None,
                "client": "octoprint",
                "client_props": {
                    "connected": True,
                    "version": {},
                    "read_only": False,
                },
            }),
            mock.call(**{
                "hostname": "b",
                "ip": "5678",
                "name": None,
                "client": "octoprint",
                "client_props": {
                    "connected": True,
                    "version": {},
                    "read_only": False,
                },
            })
        ])
