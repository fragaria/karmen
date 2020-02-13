import unittest
import mock
import random
import uuid

from server import app
from server.database import printers
from ..utils import Response
from ..utils import (
    TOKEN_ADMIN,
    TOKEN_ADMIN_CSRF,
    TOKEN_USER,
    TOKEN_USER_CSRF,
    TOKEN_USER2,
    TOKEN_USER2_CSRF,
    UUID_USER,
    UUID_ORG,
    UUID_ORG2,
)


class ListRoute(unittest.TestCase):
    def test_list_no_token(self):
        with app.test_client() as c:
            response = c.get("/organizations/%s/printers" % UUID_ORG)
            self.assertEqual(response.status_code, 401)

    def test_list_bad_org_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/not-an-uuid/printers",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_list_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_list_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.get(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_list(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            # coming from db fixtures
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            self.assertTrue("client" in response.json["items"][0])
            self.assertTrue("webcam" not in response.json["items"][0])
            self.assertTrue("status" not in response.json["items"][0])
            self.assertTrue("job" not in response.json["items"][0])
            for item in response.json["items"]:
                p = printers.get_printer(item["uuid"])
                # parallelization with delete tests
                if p is None:
                    continue
                self.assertEqual(p["organization_uuid"], UUID_ORG)

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_list_fields(self, mock_get_uri):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers?fields=webcam,status,job" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            # coming from db fixtures
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            self.assertTrue("client" in response.json["items"][0])
            self.assertTrue("webcam" in response.json["items"][0])
            self.assertTrue("status" in response.json["items"][0])
            self.assertTrue("job" in response.json["items"][0])
            self.assertTrue("client" in response.json["items"][1])
            self.assertTrue("webcam" in response.json["items"][1])
            self.assertTrue("status" in response.json["items"][1])
            self.assertTrue("job" in response.json["items"][1])


class DetailRoute(unittest.TestCase):
    def test_detail_no_token(self):
        with app.test_client() as c:
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG
            )
            self.assertEqual(response.status_code, 401)

    def test_detail_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_detail_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_detail_org_mismatch(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_detail(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" not in response.json)
            self.assertTrue(response.json["client"]["api_key"] is None)

    def test_detail_bad_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers/not-anuuid" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    @mock.patch("server.routes.printers.printers.get_printer")
    def test_no_api_key_leak(self, mock_get_printer):
        mock_get_printer.return_value = {
            "uuid": "a7984df9-ddbb-488d-943e-676a3b9f7d65",
            "organization_uuid": UUID_ORG,
            "client_props": {"api_key": "123456"},
            "client": "octoprint",
            "ip": "1.2.3.4",
        }
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" not in response.json)
            self.assertEqual(response.json["client"]["api_key"], "12" + "*" * 30)

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_fields(self, mock_get_uri):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20?fields=webcam,status,job"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" in response.json)
            self.assertTrue("status" in response.json)
            self.assertTrue("job" in response.json)

    def test_404(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers/b0cfd3b1-d602-4556-917a-6cf39576cbbc"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)


class CreateRoute(unittest.TestCase):
    def test_create_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "ip": "1.2.3.4",
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            self.assertEqual(response.status_code, 403)

    def test_create_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
                json={
                    "ip": "1.2.3.4",
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            print(response.json)
            self.assertEqual(response.status_code, 403)

    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create(self, mock_get_uri, mock_avahi):
        try:
            with app.test_client() as c:
                c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
                ip = "192.168.%s" % ".".join(
                    [str(random.randint(0, 255)) for _ in range(2)]
                )
                response = c.post(
                    "/organizations/%s/printers" % UUID_ORG,
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                    json={
                        "ip": ip,
                        "name": "random-test-printer-name",
                        "protocol": "https",
                    },
                )
                uuid = response.json["uuid"]
                self.assertEqual(response.status_code, 201)
                response = c.get(
                    "/organizations/%s/printers/%s" % (UUID_ORG, uuid),
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json["ip"], ip)
                self.assertEqual(response.json["protocol"], "https")
                self.assertEqual(response.json["name"], "random-test-printer-name")
                self.assertEqual(response.json["client"]["name"], "octoprint")
        except Exception as e:
            raise e
        finally:
            c.delete(
                "/organizations/%s/printers/%s" % (UUID_ORG, uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )

    @mock.patch(
        "server.services.network.get_avahi_address", return_value="172.16.236.220"
    )
    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create_hostname(self, mock_get_uri, mock_avahi, mock_avahi_address):
        try:
            with app.test_client() as c:
                c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
                response = c.post(
                    "/organizations/%s/printers" % UUID_ORG,
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                    json={
                        "hostname": "random-address.local",
                        "name": "random-test-printer-name",
                        "protocol": "https",
                    },
                )
                uuid = response.json["uuid"]
                self.assertEqual(response.status_code, 201)
                response = c.get(
                    "/organizations/%s/printers/%s" % (UUID_ORG, uuid),
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json["ip"], "172.16.236.220")
                self.assertEqual(response.json["hostname"], "random-address.local")
                self.assertEqual(response.json["protocol"], "https")
                self.assertEqual(response.json["name"], "random-test-printer-name")
                self.assertEqual(response.json["client"]["name"], "octoprint")
        except Exception as e:
            raise e
        finally:
            c.delete(
                "/organizations/%s/printers/%s" % (UUID_ORG, uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )

    @mock.patch(
        "server.services.network.get_avahi_address", return_value="172.16.236.220"
    )
    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create_hostname_port(self, mock_get_uri, mock_avahi, mock_avahi_address):
        uuid = None
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            try:
                response = c.post(
                    "/organizations/%s/printers" % UUID_ORG,
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                    json={
                        "hostname": "random-address.local",
                        "port": 8080,
                        "name": "random-test-printer-name",
                        "protocol": "http",
                    },
                )
                self.assertEqual(response.status_code, 201)
                uuid = response.json["uuid"]
                response = c.get(
                    "/organizations/%s/printers/%s" % (UUID_ORG, uuid),
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json["ip"], "172.16.236.220")
                self.assertEqual(response.json["port"], 8080)
                self.assertEqual(response.json["hostname"], "random-address.local")
                self.assertEqual(response.json["protocol"], "http")
                self.assertEqual(response.json["name"], "random-test-printer-name")
                self.assertEqual(response.json["client"]["name"], "octoprint")
            except Exception as e:
                raise e
            finally:
                if uuid is not None:
                    c.delete(
                        "/organizations/%s/printers/%s" % (UUID_ORG, uuid),
                        headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                    )

    @mock.patch("server.services.network.get_avahi_address", return_value=None)
    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create_hostname_no_resolution(
        self, mock_get_uri, mock_avahi, mock_avahi_address
    ):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "hostname": "random-address.local",
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            self.assertEqual(response.status_code, 500)

    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create_with_port(self, mock_get_uri, mock_avahi):
        try:
            with app.test_client() as c:
                c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
                ip = "192.168.%s" % ".".join(
                    [str(random.randint(0, 255)) for _ in range(2)]
                )
                response = c.post(
                    "/organizations/%s/printers" % UUID_ORG,
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                    json={
                        "ip": ip,
                        "port": 81,
                        "name": "random-test-printer-name",
                        "protocol": "https",
                    },
                )
                self.assertEqual(response.status_code, 201)
                response = c.get(
                    "/organizations/%s/printers/%s" % (UUID_ORG, response.json["uuid"]),
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json["ip"], ip)
                self.assertEqual(response.json["port"], 81)
                self.assertEqual(response.json["protocol"], "https")
                self.assertEqual(response.json["name"], "random-test-printer-name")
                self.assertEqual(response.json["client"]["name"], "octoprint")
        except Exception as e:
            raise e
        finally:
            c.delete(
                "/organizations/%s/printers/172.16.236.200:81" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )

    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create_default_protocol(self, mock_get_uri, mock_avahi):
        try:
            with app.test_client() as c:
                c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
                ip = "192.168.%s" % ".".join(
                    [str(random.randint(0, 255)) for _ in range(2)]
                )
                response = c.post(
                    "/organizations/%s/printers" % UUID_ORG,
                    json={"ip": ip, "port": 81, "name": "random-test-printer-name",},
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                )
                uuid = response.json["uuid"]
                self.assertEqual(response.status_code, 201)
                response = c.get(
                    "/organizations/%s/printers/%s" % (UUID_ORG, uuid),
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json["ip"], ip)
                self.assertEqual(response.json["port"], 81)
                self.assertEqual(response.json["protocol"], "http")
                self.assertEqual(response.json["name"], "random-test-printer-name")
                self.assertEqual(response.json["client"]["name"], "octoprint")
        except Exception as e:
            raise e
        finally:
            c.delete(
                "/organizations/%s/printers/%s" % (UUID_ORG, uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )

    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create_http(self, mock_get_uri, mock_avahi):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "host": "http://172.16.236.200:81",
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            self.assertEqual(response.status_code, 400)

    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_create_dotcom(self, mock_get_uri, mock_avahi):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "host": "http://printer.example.com",
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "host": "172.16.236.200:81",
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                json={
                    "host": "172.16.236.200:81",
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_empty_req(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_protocol(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"host": "172.16.236.200", "name": "something", "protocol": "ftp"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_name(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"host": "172.16.236.200"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_ip(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "172.16.236.200"},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_ip(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "name...", "host": "bad-ip-address"},
            )
            self.assertEqual(response.status_code, 400)

    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_conflict(self, mock_get_hostname, mock_get):
        try:
            ip = "192.168.%s" % ".".join(
                [str(random.randint(0, 255)) for _ in range(2)]
            )
            with app.test_client() as c:
                c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
                response = c.post(
                    "/organizations/%s/printers" % UUID_ORG,
                    json={"ip": ip, "port": 81, "name": "random-test-printer-name",},
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                )
                self.assertEqual(response.status_code, 201)
                response = c.post(
                    "/organizations/%s/printers" % UUID_ORG,
                    json={"ip": ip, "port": 81, "name": "random-test-printer-name",},
                    headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                )
                self.assertEqual(response.status_code, 409)
        except Exception as e:
            raise e
        finally:
            c.delete(
                "/organizations/%s/printers/%s" % (UUID_ORG, uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )


class DeleteRoute(unittest.TestCase):
    @mock.patch("server.services.network.get_avahi_hostname", return_value=None)
    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_delete(self, mock_get_uri, mock_avahi):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            ip = "192.168.%s" % ".".join(
                [str(random.randint(0, 255)) for _ in range(2)]
            )
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"ip": ip, "name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 201)
            response = c.delete(
                "/organizations/%s/printers/%s" % (UUID_ORG, response.json["uuid"]),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 204)

    def test_delete_bad_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.delete(
                "/organizations/%s/printers/6d01e8f0-275e-4389-bdcd-7ff0db8e371d"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 401)

    def test_no_token(self):
        with app.test_client() as c:
            response = c.delete(
                "/organizations/%s/printers/6d01e8f0-275e-4389-bdcd-7ff0db8e371d"
                % UUID_ORG
            )
            self.assertEqual(response.status_code, 401)

    def test_delete_bad_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.delete(
                "/organizations/%s/printers/172.16.236.213" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_delete_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.delete(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_delete_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.delete(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_delete_org_mismatch(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.delete(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_delete_unknown(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.delete(
                "/organizations/%s/printers/6d01e8f0-275e-4389-bdcd-7ff0db8e371d"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)


class PatchRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = uuid.uuid4()
        printers.delete_printer(self.uuid)
        printers.add_printer(
            uuid=self.uuid,
            name="name",
            organization_uuid=UUID_ORG,
            hostname="hostname",
            ip="192.168.%s" % ".".join([str(random.randint(0, 255)) for _ in range(2)]),
            client="octoprint",
            client_props={"version": "123"},
            printer_props={"filament_type": "PLA"},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)

    def test_patch(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "random-test-printer-name", "protocol": "https"},
            )
            self.assertEqual(response.status_code, 200)
            p = printers.get_printer(self.uuid)
            self.assertEqual(p["name"], "random-test-printer-name")
            self.assertEqual(p["protocol"], "https")

    def test_patch_printer_props(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "name": "random-test-printer-name",
                    "printer_props": {
                        "filament_type": "PETG",
                        "filament_color": "žluťoučká",
                        "random": "key",
                    },
                },
            )
            self.assertEqual(response.status_code, 200)
            p = printers.get_printer(self.uuid)
            self.assertEqual(p["printer_props"]["filament_type"], "PETG")
            self.assertEqual(p["printer_props"]["filament_color"], "žluťoučká")
            self.assertTrue("random" not in p["printer_props"])

    @mock.patch("server.clients.octoprint.requests.Session.get", return_value=None)
    def test_patch_api_keychange(self, mock_session_get):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "random-test-printer-name", "api_key": "1234",},
            )
            self.assertEqual(response.status_code, 200)
            p = printers.get_printer(self.uuid)
            self.assertEqual(p["client_props"]["api_key"], "1234")
            self.assertEqual(mock_session_get.call_count, 1)

    def test_patch_no_token(self):
        with app.test_client() as c:
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                json={"name": "random-test-printer-name", "protocol": "https"},
            )
            self.assertEqual(response.status_code, 401)

    def test_patch_bad_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": "random-test-printer-name", "protocol": "https"},
            )
            self.assertEqual(response.status_code, 403)

    def test_patch_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers/%s"
                % self.uuid,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_patch_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_patch_org_mismatch(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG2, self.uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_patch_bad_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/random-unknown-printer" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 400)

    def test_patch_unknown(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/4d303a17-5310-4515-ba6e-997d297e7e64"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 404)

    def test_patch_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_patch_empty_name(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": ""},
            )
            self.assertEqual(response.status_code, 400)

    def test_patch_bad_protocol(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "some", "protocol": "ftp"},
            )
            self.assertEqual(response.status_code, 400)


class CurrentJobRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = uuid.uuid4()
        printers.delete_printer(self.uuid)
        printers.add_printer(
            uuid=self.uuid,
            organization_uuid=UUID_ORG,
            name="name",
            hostname="hostname",
            ip="192.168.%s" % ".".join([str(random.randint(0, 255)) for _ in range(2)]),
            client="octoprint",
            client_props={"version": "123", "connected": True},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)

    def test_current_job_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 401)

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    def test_current_job_admin(self, post_uri_mock):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    def test_current_job_user(self, post_uri_mock):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch("server.clients.octoprint.requests.post", return_value=None)
    def test_current_job_unable_to_call_printer(self, post_uri_mock):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 409)

    def test_current_job_bad_action(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_current_job_unknown_printer(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/4d378856-8f57-4a91-804b-e862784719e4/current-job"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 404)

    def test_current_job_bad_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/random-unknown-printer/current-job"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 400)

    def test_current_job_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_current_job_empty_action(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": ""},
            )
            self.assertEqual(response.status_code, 400)


class PrinterConnectionRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = uuid.uuid4()
        printers.delete_printer(self.uuid)
        printers.add_printer(
            uuid=self.uuid,
            organization_uuid=UUID_ORG,
            name="name",
            hostname="hostname",
            ip="192.168.%s" % ".".join([str(random.randint(0, 255)) for _ in range(2)]),
            client="octoprint",
            client_props={"version": "123", "connected": True},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Offline"}}),
    )
    def test_change_connection_to_online(self, mock_get_uri, mock_post_uri):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"state": "online"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Printing"}}),
    )
    def test_change_connection_to_online_already_on(self, mock_get_uri, mock_post_uri):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"state": "online"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Offline"}}),
    )
    def test_change_connection_to_offline_already_off(
        self, mock_get_uri, mock_post_uri
    ):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"state": "offline"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_change_connection_to_offline(self, mock_get_uri, mock_post_uri):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"state": "offline"},
            )
            self.assertEqual(response.status_code, 204)

    @mock.patch("server.clients.octoprint.requests.post", return_value=Response(204))
    @mock.patch(
        "server.clients.octoprint.requests.Session.get",
        return_value=Response(200, {"state": {"text": "Operational"}}),
    )
    def test_change_connection_user_token(self, mock_get_uri, mock_post_uri):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"state": "online"},
            )
            self.assertEqual(response.status_code, 204)

    def test_change_connection_bad_token(self):
        with app.test_client() as c:
            c.set_cookie(
                "localhost",
                "access_token_cookie",
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
            )
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": "387c0717-648d-4967-a732-9515af7f34d9"},
                json={"state": "online"},
            )
            self.assertEqual(response.status_code, 422)

    def test_change_connection_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                json={"state": "online"},
            )
            self.assertEqual(response.status_code, 401)

    def test_change_connection_bad_state(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"state": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_change_connection_bad_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/random-unknown-printer/connection",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 400)

    def test_change_connection_unknown_printer(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/2a7d5416-9f49-4bec-8b80-f9a45e5bf3b4/connection"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 404)

    def test_change_connection_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_change_connection_empty_state(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"state": ""},
            )
            self.assertEqual(response.status_code, 400)


class WebcamSnapshotRoute(unittest.TestCase):
    def test_bad_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/organizations/%s/printers/notuuid/webcam-snapshot" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_printer(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/organizations/%s/printers/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/webcam-snapshot"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_no_webcam_info(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20/webcam-snapshot"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)
