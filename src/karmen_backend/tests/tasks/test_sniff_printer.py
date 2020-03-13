import unittest
import mock
import pickle
import random
import uuid as guid

from server.tasks.sniff_printer import save_printer_data, sniff_printer
from server.clients.utils import PrinterClientAccessLevel
from ..utils import Response, UUID_ORG


class SavePrinterDataTest(unittest.TestCase):
    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch(
        "server.database.network_clients.get_network_client_by_props", return_value=None
    )
    def test_not_update_inactive_unknown_printer(
        self, mock_get_printer, mock_add_printer, mock_update_printer
    ):
        save_printer_data(
            uuid=guid.uuid4(), ip="1.2.3.4", client_props={"connected": False}
        )
        self.assertEqual(mock_get_printer.call_count, 0)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 0)

    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch("server.database.network_clients.add_network_client")
    @mock.patch(
        "server.database.network_clients.get_network_client_by_props", return_value=None
    )
    @mock.patch(
        "server.database.printers.get_printer_by_network_client_uuid",
        return_value=None,
    )
    def test_add_active_unknown_printer(
        self,
        mock_get_printer,
        mock_get_network_client,
        mock_add_network_client,
        mock_add_printer,
        mock_update_printer,
    ):
        save_printer_data(
            uuid=guid.uuid4(),
            network_client_uuid=guid.uuid4(),
            organization_uuid=guid.uuid4(),
            ip="192.168.%s" % ".".join([str(random.randint(0, 255)) for _ in range(2)]),
            port=80,
            client="octoprint",
            client_props={"connected": True},
        )
        self.assertEqual(mock_get_network_client.call_count, 1)
        self.assertEqual(mock_get_printer.call_count, 0)
        self.assertEqual(mock_add_printer.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 0)
        self.assertEqual(mock_add_network_client.call_count, 1)

    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch("server.database.network_clients.add_network_client")
    @mock.patch(
        "server.database.network_clients.get_network_client_by_props",
        return_value={"network_client_uuid": guid.uuid4(),},
    )
    @mock.patch(
        "server.database.printers.get_printer_by_network_client_uuid",
        return_value=None,
    )
    def test_add_active_known_printer(
        self,
        mock_get_printer,
        mock_get_network_client,
        mock_add_network_client,
        mock_add_printer,
        mock_update_printer,
    ):
        uuid = guid.uuid4()
        ncuid = guid.uuid4()
        orguid = guid.uuid4()
        save_printer_data(
            uuid=uuid,
            network_client_uuid=ncuid,
            organization_uuid=orguid,
            name="myname",
            ip="1.2.3.4",
            port=80,
            client="octoprint",
            client_props={"connected": True},
        )
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 1)
        self.assertEqual(mock_update_printer.call_count, 0)
        self.assertEqual(mock_add_network_client.call_count, 0)
        mock_add_printer.any_call_with(
            {
                "uuid": uuid,
                "network_client_uuid": ncuid,
                "organization_uuid": orguid,
                "name": "myname",
                "client_props": {"connected": True},
                "printer_props": None,
            }
        )

    @mock.patch("server.database.printers.update_printer")
    @mock.patch("server.database.printers.add_printer")
    @mock.patch(
        "server.database.network_clients.get_network_client_by_props",
        return_value={
            "name": "1234",
            "ip": "1.2.3.4.",
            "client_props": {"api_key": "5678"},
        },
    )
    @mock.patch(
        "server.database.printers.get_printer_by_network_client_uuid",
        return_value={"name": "1234",},
    )
    def test_not_update_any_known_printer(
        self,
        mock_get_printer,
        mock_get_network_client,
        mock_add_printer,
        mock_update_printer,
    ):
        save_printer_data(
            uuid=guid.uuid4(),
            ip="1.2.3.4",
            client_props={"connected": True},
            name="1.2.3.4",
        )
        self.assertEqual(mock_get_printer.call_count, 1)
        self.assertEqual(mock_get_network_client.call_count, 1)
        self.assertEqual(mock_add_printer.call_count, 0)
        self.assertEqual(mock_update_printer.call_count, 0)


class SniffPrinterTest(unittest.TestCase):
    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_not_add_no_data_responding_printer(self, mock_get_data, mock_save_printer):
        sniff_printer(UUID_ORG, "octopi.local", "192.168.1.10")
        self.assertEqual(mock_save_printer.call_count, 0)

    @mock.patch("server.clients.cachedoctoprint.redisinstance")
    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    def test_not_add_bad_data_responding_printer(
        self, mock_get_data, mock_save_printer, mock_redis
    ):
        mock_redis.get.return_value = None
        mock_get_data.return_value.status_code = 200
        mock_get_data.return_value.json.return_value = {"text": "Fumbleprint"}
        sniff_printer(UUID_ORG, "octopi.local", "192.168.1.11")
        self.assertEqual(mock_save_printer.call_count, 0)

    @mock.patch("server.tasks.sniff_printer.guid.uuid4", return_value="1234")
    @mock.patch("server.clients.cachedoctoprint.redisinstance")
    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"text": "OctoPrint"}),
    )
    def test_add_responding_printer(
        self, mock_get_data, mock_update_printer, mock_redis, mock_uuid
    ):
        mock_redis.get.return_value = pickle.dumps(Response(200, {"text": "OctoPrint"}))
        sniff_printer(UUID_ORG, "octopi.local", "192.168.1.12")
        self.assertEqual(mock_get_data.call_count, 2)
        self.assertEqual(mock_update_printer.call_count, 1)
        mock_update_printer.assert_called_with(
            **{
                "uuid": "1234",
                "network_client_uuid": "1234",
                "organization_uuid": UUID_ORG,
                "protocol": "http",
                "name": "octopi.local",
                "ip": "192.168.1.12",
                "hostname": "octopi.local",
                "port": 80,
                "path": "",
                "token": None,
                "client": "octoprint",
                "client_props": {
                    "connected": True,
                    "version": {"text": "OctoPrint"},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                    "api_key": None,
                    "webcam": {"message": "Webcam disabled in octoprint"},
                    "plugins": [],
                },
                "printer_props": None,
            }
        )

    @mock.patch("server.tasks.sniff_printer.guid.uuid4", return_value="1234")
    @mock.patch("server.tasks.sniff_printer.save_printer_data")
    @mock.patch("server.clients.octoprint.requests.Session.get")
    @mock.patch("server.clients.cachedoctoprint.redisinstance")
    def test_try_http_and_https(
        self, mock_octoprint_redis, mock_get_data, mock_update_printer, mock_uuid
    ):
        def mock_call(uri, **kwargs):
            if "https" in uri:
                return Response(200, {"text": "OctoPrint"})
            return None

        mock_get_data.side_effect = mock_call
        mock_octoprint_redis.get.return_value = None

        sniff_printer(UUID_ORG, "octopi.local", "192.168.1.12")
        self.assertEqual(mock_update_printer.call_count, 1)
        self.assertEqual(mock_get_data.call_count, 4)
        mock_update_printer.assert_called_with(
            **{
                "uuid": "1234",
                "network_client_uuid": "1234",
                "organization_uuid": UUID_ORG,
                "name": "octopi.local",
                "protocol": "https",
                "ip": "192.168.1.12",
                "hostname": "octopi.local",
                "port": 443,
                "path": "",
                "token": None,
                "client": "octoprint",
                "client_props": {
                    "connected": True,
                    "version": {"text": "OctoPrint"},
                    "access_level": PrinterClientAccessLevel.UNLOCKED,
                    "api_key": None,
                    "webcam": {"message": "Webcam disabled in octoprint"},
                    "plugins": [],
                },
                "printer_props": None,
            }
        )
