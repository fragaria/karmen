import unittest
import mock

from server import app
from server.database import printers
from ..utils import Response
from ..utils import TOKEN_ADMIN, TOKEN_USER, TOKEN_USER2


class ListRoute(unittest.TestCase):
    def test_list_no_token(self):
        with app.test_client() as c:
            response = c.get("/printers")
            self.assertEqual(response.status_code, 401)

    def test_list(self):
        with app.test_client() as c:
            response = c.get(
                "/printers", headers={"Authorization": "Bearer %s" % TOKEN_USER}
            )
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

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_list_fields(self, mock_get_uri):
        with app.test_client() as c:
            response = c.get(
                "/printers?fields=webcam,status,job",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
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
    def test_list_no_token(self):
        with app.test_client() as c:
            response = c.get("/printers/172.16.236.11:8080")
            self.assertEqual(response.status_code, 401)

    def test_detail(self):
        with app.test_client() as c:
            response = c.get(
                "/printers/172.16.236.11:8080",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" not in response.json)
            self.assertTrue(response.json["client"]["api_key"] is None)

    @mock.patch("server.routes.printers.printers.get_printer")
    def test_no_api_key_leak(self, mock_get_printer):
        mock_get_printer.return_value = {
            "client_props": {"api_key": "123456"},
            "client": "octoprint",
            "host": "1.2.3.4",
        }
        with app.test_client() as c:
            response = c.get(
                "/printers/172.16.236.11:8080",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" not in response.json)
            self.assertEqual(response.json["client"]["api_key"], "12****")

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_fields(self, mock_get_uri):
        with app.test_client() as c:
            response = c.get(
                "/printers/172.16.236.11:8080?fields=webcam,status,job",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" in response.json)
            self.assertTrue("status" in response.json)
            self.assertTrue("job" in response.json)

    def test_404(self):
        with app.test_client() as c:
            response = c.get(
                "/printers/172.16.236.35",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 404)


class CreateRoute(unittest.TestCase):
    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create(self, mock_get_uri, mock_avahi):
        try:
            with app.test_client() as c:
                response = c.post(
                    "/printers",
                    headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                    json={
                        "host": "172.16.236.200:81",
                        "name": "random-test-printer-name",
                        "protocol": "https",
                    },
                )
                self.assertEqual(response.status_code, 201)
                response = c.get(
                    "/printers/172.16.236.200:81",
                    headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json["host"], "172.16.236.200:81")
                self.assertEqual(response.json["protocol"], "https")
                self.assertEqual(response.json["name"], "random-test-printer-name")
                self.assertEqual(response.json["client"]["name"], "octoprint")
        except Exception as e:
            raise e
        finally:
            c.delete(
                "/printers/172.16.236.200:81",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )

    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create_default_protocol(self, mock_get_uri, mock_avahi):
        try:
            with app.test_client() as c:
                response = c.post(
                    "/printers",
                    json={
                        "host": "172.16.236.200:81",
                        "name": "random-test-printer-name",
                    },
                    headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                )
                self.assertEqual(response.status_code, 201)
                response = c.get(
                    "/printers/172.16.236.200:81",
                    headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json["host"], "172.16.236.200:81")
                self.assertEqual(response.json["protocol"], "http")
                self.assertEqual(response.json["name"], "random-test-printer-name")
                self.assertEqual(response.json["client"]["name"], "octoprint")
        except Exception as e:
            raise e
        finally:
            c.delete(
                "/printers/172.16.236.200:81",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )

    def test_bad_token(self):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={
                    "host": "172.16.236.200:81",
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            self.assertEqual(response.status_code, 401)

    def tes_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                json={
                    "host": "172.16.236.200:81",
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_empty_req(self):
        with app.test_client() as c:
            response = c.post(
                "/printers", headers={"Authorization": "Bearer %s" % TOKEN_ADMIN}
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_protocol(self):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"host": "172.16.236.200", "name": "something", "protocol": "ftp"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_name(self):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"host": "172.16.236.200"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_ip(self):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"name": "172.16.236.200"},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_ip(self):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"name": "name...", "host": "bad-ip-address"},
            )
            self.assertEqual(response.status_code, 400)

    def test_conflict(self):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"name": "existing-printer", "host": "172.16.236.11:8080"},
            )
            self.assertEqual(response.status_code, 409)


class DeleteRoute(unittest.TestCase):
    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_delete(self, mock_get_uri, mock_avahi):
        with app.test_client() as c:
            response = c.post(
                "/printers",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"host": "172.16.236.200:81", "name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 201)
            response = c.delete(
                "/printers/172.16.236.200:81",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(response.status_code, 204)

    def test_delete_bad_token(self):
        with app.test_client() as c:
            response = c.delete(
                "/printers/172.16.236.213",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 401)

    def test_no_token(self):
        with app.test_client() as c:
            response = c.delete("/printers/172.16.236.213")
            self.assertEqual(response.status_code, 401)

    def test_delete_unknown(self):
        with app.test_client() as c:
            response = c.delete(
                "/printers/172.16.236.213",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(response.status_code, 404)


class PatchRoute(unittest.TestCase):
    def setUp(self):
        printers.delete_printer("1.2.3.4")
        printers.add_printer(
            name="name",
            hostname="hostname",
            host="1.2.3.4",
            client="octoprint",
            client_props={"version": "123"},
            printer_props={"filament_type": "PLA"},
        )

    def tearDown(self):
        printers.delete_printer("1.2.3.4")

    def test_patch(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/1.2.3.4",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"name": "random-test-printer-name", "protocol": "https"},
            )
            self.assertEqual(response.status_code, 204)
            p = printers.get_printer("1.2.3.4")
            self.assertEqual(p["name"], "random-test-printer-name")
            self.assertEqual(p["protocol"], "https")

    def test_patch_printer_props(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/1.2.3.4",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
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

    def test_patch_no_token(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/1.2.3.4",
                json={"name": "random-test-printer-name", "protocol": "https"},
            )
            self.assertEqual(response.status_code, 401)

    def test_patch_bad_token(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/1.2.3.4",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"name": "random-test-printer-name", "protocol": "https"},
            )
            self.assertEqual(response.status_code, 401)

    def test_patch_unknown(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/random-unknown-printer",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 404)

    def test_patch_no_data(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/1.2.3.4",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(response.status_code, 400)

    def test_patch_empty_name(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/1.2.3.4",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"name": ""},
            )
            self.assertEqual(response.status_code, 400)

    def test_patch_empty_bad_protocol(self):
        with app.test_client() as c:
            response = c.patch(
                "/printers/1.2.3.4",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"name": "some", "protocol": "ftp"},
            )
            self.assertEqual(response.status_code, 400)


class CurrentJobRoute(unittest.TestCase):
    def setUp(self):
        printers.delete_printer("1.2.3.4")
        printers.add_printer(
            name="name",
            hostname="hostname",
            host="1.2.3.4",
            client="octoprint",
            client_props={"version": "123", "connected": True},
        )

    def tearDown(self):
        printers.delete_printer("1.2.3.4")

    def test_current_job_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job", json={"action": "cancel"}
            )
            self.assertEqual(response.status_code, 401)

    @mock.patch(
        "server.clients.octoprint.requests.Session.post", return_value=Response(204)
    )
    def test_current_job(self, post_uri_mock):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 204)

    # TODO
    # @mock.patch(
    #     "server.clients.octoprint.requests.Session.post", return_value=Response(204)
    # )
    # def test_current_job_different_user(self, post_uri_mock):
    #     with app.test_client() as c:
    #         response = c.post(
    #             "/printers/1.2.3.4/current-job",
    #             headers={"Authorization": "Bearer %s" % TOKEN_USER2},
    #             json={"action": "cancel"},
    #         )
    #         self.assertEqual(response.status_code, 401)

    @mock.patch(
        "server.clients.octoprint.requests.Session.post", return_value=Response(204)
    )
    def test_current_job_admin(self, post_uri_mock):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch("server.clients.octoprint.requests.Session.post", return_value=None)
    def test_current_job_unable(self, post_uri_mock):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 409)

    def test_current_job_bad_action(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"action": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_current_job_unknown_printer(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/random-unknown-printer/current-job",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 404)

    def test_current_job_no_data(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 400)

    def test_current_job_empty_action(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/current-job",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"action": ""},
            )
            self.assertEqual(response.status_code, 400)


class PrinterConnectionRoute(unittest.TestCase):
    def setUp(self):
        printers.delete_printer("1.2.3.4")
        printers.add_printer(
            name="name",
            hostname="hostname",
            host="1.2.3.4",
            client="octoprint",
            client_props={"version": "123", "connected": True},
        )

    def tearDown(self):
        printers.delete_printer("1.2.3.4")

    @mock.patch(
        "server.clients.octoprint.requests.Session.post", return_value=Response(204)
    )
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Offline"}}),
    )
    def test_change_connection_to_online(self, mock_get_uri, mock_post_uri):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/connection",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"state": "online"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch(
        "server.clients.octoprint.requests.Session.post", return_value=Response(204)
    )
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Printing"}}),
    )
    def test_change_connection_to_online_already_on(self, mock_get_uri, mock_post_uri):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/connection",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"state": "online"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch(
        "server.clients.octoprint.requests.Session.post", return_value=Response(204)
    )
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Offline"}}),
    )
    def test_change_connection_to_offline_already_off(
        self, mock_get_uri, mock_post_uri
    ):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/connection",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"state": "offline"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch(
        "server.clients.octoprint.requests.Session.post", return_value=Response(204)
    )
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_change_connection_to_offline(self, mock_get_uri, mock_post_uri):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/connection",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"state": "offline"},
            )
            self.assertEqual(response.status_code, 204)

    def test_change_connection_bad_token(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/connection",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"state": "online"},
            )
            self.assertEqual(response.status_code, 401)

    def test_change_connection_no_token(self):
        with app.test_client() as c:
            response = c.post("/printers/1.2.3.4/connection", json={"state": "online"})
            self.assertEqual(response.status_code, 401)

    def test_change_connection_bad_state(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/connection",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"state": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_change_connection_unknown_printer(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/random-unknown-printer/connection",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 404)

    def test_change_connection_no_data(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/connection",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(response.status_code, 400)

    def test_change_connection_empty_state(self):
        with app.test_client() as c:
            response = c.post(
                "/printers/1.2.3.4/connection",
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
                json={"state": ""},
            )
            self.assertEqual(response.status_code, 400)
