import unittest
import mock

from server import app
from server.database import printers


class ListRoute(unittest.TestCase):
    def test_list(self):
        with app.test_client() as c:
            response = c.get("/printers")
            self.assertEqual(response.status_code, 200)
            # coming from db fixtures
            self.assertTrue("items" in response.json)
            self.assertEqual(len(response.json["items"]), 2)
            self.assertTrue("client" in response.json["items"][0])
            self.assertTrue("webcam" not in response.json["items"][0])
            self.assertTrue("status" not in response.json["items"][0])
            self.assertTrue("job" not in response.json["items"][0])
            self.assertTrue("client" in response.json["items"][1])
            self.assertTrue("webcam" not in response.json["items"][1])
            self.assertTrue("status" not in response.json["items"][1])
            self.assertTrue("job" not in response.json["items"][1])

    @mock.patch("server.clients.octoprint.get_uri", return_value=None)
    def test_list_fields(self, mock_get_uri):
        with app.test_client() as c:
            response = c.get("/printers?fields=webcam,status,job")
            self.assertEqual(response.status_code, 200)
            # coming from db fixtures
            self.assertTrue("items" in response.json)
            self.assertEqual(len(response.json["items"]), 2)
            self.assertTrue("client" in response.json["items"][0])
            self.assertTrue("webcam" in response.json["items"][0])
            self.assertTrue("status" in response.json["items"][0])
            self.assertTrue("job" in response.json["items"][0])
            self.assertTrue("client" in response.json["items"][1])
            self.assertTrue("webcam" in response.json["items"][1])
            self.assertTrue("status" in response.json["items"][1])
            self.assertTrue("job" in response.json["items"][1])


class DetailRoute(unittest.TestCase):
    def test_detail(self):
        with app.test_client() as c:
            response = c.get("/printers/172.16.236.11:8080")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" not in response.json)

    @mock.patch("server.clients.octoprint.get_uri", return_value=None)
    def test_fields(self, mock_get_uri):
        with app.test_client() as c:
            response = c.get("/printers/172.16.236.11:8080?fields=webcam,status,job")
            self.assertEqual(response.status_code, 200)
            print(response.json)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" in response.json)
            self.assertTrue("status" in response.json)
            self.assertTrue("job" in response.json)

    def test_404(self):
        with app.test_client() as c:
            response = c.get("/printers/172.16.236.35")
            self.assertEqual(response.status_code, 404)


class CreateRoute(unittest.TestCase):
    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.get_uri", return_value=None)
    def test_create(self, mock_get_uri, mock_avahi):
        try:
            with app.test_client() as c:
                response = c.post(
                    "/printers",
                    json={
                        "ip": "172.16.236.200:81",
                        "name": "random-test-printer-name",
                    },
                )
                self.assertEqual(response.status_code, 201)
                response = c.get("/printers/172.16.236.200:81")
                self.assertEqual(response.json["ip"], "172.16.236.200:81")
                self.assertEqual(response.json["name"], "random-test-printer-name")
                self.assertEqual(response.json["client"]["name"], "octoprint")
        except Exception as e:
            raise e
        finally:
            c.delete("/printers/172.16.236.200:81")

    def test_empty_req(self):
        with app.test_client() as c:
            response = c.post("/printers")
            self.assertEqual(response.status_code, 400)

    def test_missing_name(self):
        with app.test_client() as c:
            response = c.post("/printers", json={"ip": "172.16.236.200"})
            self.assertEqual(response.status_code, 400)

    def test_missing_ip(self):
        with app.test_client() as c:
            response = c.post("/printers", json={"name": "172.16.236.200"})
            self.assertEqual(response.status_code, 400)

    def test_bad_ip(self):
        with app.test_client() as c:
            response = c.post(
                "/printers", json={"name": "name...", "ip": "bad-ip-address"}
            )
            self.assertEqual(response.status_code, 400)

    def test_conflict(self):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                json={"name": "existing-printer", "ip": "172.16.236.11:8080"},
            )
            self.assertEqual(response.status_code, 409)


class DeleteRoute(unittest.TestCase):
    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.get_uri", return_value=None)
    def test_delete(self, mock_get_uri, mock_avahi):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                json={"ip": "172.16.236.200:81", "name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 201)
            response = c.delete("/printers/172.16.236.200:81")
            self.assertEqual(response.status_code, 204)

    def test_delete_unknown(self):
        with app.test_client() as c:
            response = c.delete("/printers/172.16.236.213")
            self.assertEqual(response.status_code, 404)


class PatchRoute(unittest.TestCase):
    def setUp(self):
        printers.delete_printer("1.2.3.4")
        printers.add_printer(
            name="name",
            hostname="hostname",
            ip="1.2.3.4",
            client="octoprint",
            client_props={"version": "123"},
            printer_props={"filament_type": "PLA"},
        )

    def tearDown(self):
        printers.delete_printer("1.2.3.4")

    def test_patch(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/1.2.3.4", json={"name": "random-test-printer-name"}
            )
            self.assertEqual(response.status_code, 204)

    def test_patch_printer_props(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/1.2.3.4",
                json={
                    "name": "random-test-printer-name",
                    "printer_props": {
                        "filament_type": "PETG",
                        "filament_color": "žluťoučká",
                        "random": "key",
                    },
                },
            )
            self.assertEqual(response.status_code, 204)
            p = printers.get_printer("1.2.3.4")
            self.assertEqual(p["printer_props"]["filament_type"], "PETG")
            self.assertEqual(p["printer_props"]["filament_color"], "žluťoučká")
            self.assertTrue("random" not in p["printer_props"])

    def test_patch_unknown(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/random-unknown-printer",
                json={"name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 404)

    def test_patch_no_data(self):
        with app.test_client() as c:
            response = c.patch("/printers/1.2.3.4")
            self.assertEqual(response.status_code, 400)

    def test_patch_empty_name(self):
        with app.test_client() as c:
            response = c.patch("/printers/1.2.3.4", json={"name": ""})
            self.assertEqual(response.status_code, 400)


class CurrentJobRoute(unittest.TestCase):
    def setUp(self):
        printers.delete_printer("1.2.3.4")
        printers.add_printer(
            name="name",
            hostname="hostname",
            ip="1.2.3.4",
            client="octoprint",
            client_props={"version": "123", "connected": True},
        )

    def tearDown(self):
        printers.delete_printer("1.2.3.4")

    @mock.patch("server.clients.octoprint.post_uri")
    def test_current_job(self, post_uri_mock):
        post_uri_mock.return_value = True

        class Response:
            def __init__(self, status_code, contents, json=None):
                self.status_code = status_code
                self.contents = contents
                self.json_data = json

            def json(self):
                return self.json_data or {}

        def mock_call(ip, **kwargs):
            return Response(204, "")

        post_uri_mock.side_effect = mock_call
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job", json={"action": "cancel"}
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch("server.clients.octoprint.post_uri", return_value=None)
    def test_current_job_unable(self, post_uri_mock):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job", json={"action": "cancel"}
            )
            self.assertEqual(response.status_code, 409)

    def test_current_job_bad_action(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job", json={"action": "random"}
            )
            self.assertEqual(response.status_code, 400)

    def test_current_job_unknown_printer(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/random-unknown-printer/current-job",
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 404)

    def test_current_job_no_data(self):
        with app.test_client() as c:
            response = c.post("/printers/1.2.3.4/current-job")
            self.assertEqual(response.status_code, 400)

    def test_current_job_empty_action(self):
        with app.test_client() as c:
            response = c.post("/printers/1.2.3.4/current-job", json={"action": ""})
            self.assertEqual(response.status_code, 400)
