import unittest
import random
import string
import uuid as guid

from server.database import printers, network_clients
from ..utils import Response
from ..utils import (
    TOKEN_ADMIN,
    TOKEN_ADMIN_CSRF,
    TOKEN_USER,
    TOKEN_USER_CSRF,
    TOKEN_USER2,
    TOKEN_USER2_CSRF,
    UUID_ORG,
    UUID_ORG2,
ApiTestClient
)


def get_random_token():
    alphabet = string.ascii_lowercase
    return "".join(random.sample(alphabet, 8))


def get_random_hostname():
    return "%s.local" % get_random_token()


class ListRoute(unittest.TestCase):
    def test_list_no_token(self):
        with ApiTestClient() as c:
            response = c.get("/organizations/%s/printers" % UUID_ORG)
            self.assertEqual(response.status_code, 401)

    def test_list_bad_org_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/not-an-uuid/printers",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_list_unknown_org(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_list_no_org_member(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.get(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_list(self):
        with ApiTestClient() as c:
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

    def test_list_fields(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers?fields=webcam,status,job,lights" % UUID_ORG,
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
            self.assertTrue("lights" in response.json["items"][1])


class DetailRoute(unittest.TestCase):
    def test_detail_no_token(self):
        with ApiTestClient() as c:
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG
            )
            self.assertEqual(response.status_code, 401)

    def test_detail_unknown_org(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_detail_no_org_member(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_detail_org_mismatch(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_detail(self):
        with ApiTestClient() as c:
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
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers/not-anuuid" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)



    def test_fields(self):
        with ApiTestClient() as c:
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
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printers/b0cfd3b1-d602-4556-917a-6cf39576cbbc"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)


class CreateRoute(unittest.TestCase):
    def test_create_no_payload(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_create_unknown_org(self):
        with ApiTestClient() as c:
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
        with ApiTestClient() as c:
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



    def test_create_empty_data(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)


    def test_bad_token(self):
        with ApiTestClient() as c:
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
        with ApiTestClient() as c:
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                json={
                    "ip": "172.16.236.200",
                    "port": 81,
                    "name": "random-test-printer-name",
                    "protocol": "https",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_empty_req(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_protocol(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"host": "172.16.236.200", "name": "something", "protocol": "ftp"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_name(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"host": "172.16.236.200"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_ip(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "172.16.236.200"},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_ip(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "name...", "host": "bad-ip-address"},
            )
            self.assertEqual(response.status_code, 400)



    def test_conflict_tokens(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            token = get_random_token()
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                json={
                    "protocol": "http",
                    "token": token,
                    "name": "random-test-printer-name",
                },
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            print(response.data)
            self.assertEqual(response.status_code, 201)
            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                json={
                    "protocol": "http",
                    "token": token,
                    "name": "random-test-printer-name",
                },
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 409)


class DeleteRoute(unittest.TestCase):

    def test_delete(self):

        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)

            response = c.post(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"token": get_random_token(), "name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 201)
            response = c.delete(
                "/organizations/%s/printers/%s" % (UUID_ORG, response.json["uuid"]),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 204)




    def test_delete_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.delete(
                "/organizations/%s/printers/172.16.236.213" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_delete_unknown_org(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.delete(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_delete_no_org_member(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.delete(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_delete_org_mismatch(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.delete(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20"
                % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_delete_unknown(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.delete(
                "/organizations/%s/printers/6d01e8f0-275e-4389-bdcd-7ff0db8e371d"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)


class PatchRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid,
            ip="192.168.%s" % ".".join([str(random.randint(0, 255)) for _ in range(2)]),
            hostname="hostname",
            client="octoprint",
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={"version": "123", "connected": True},
            printer_props={"filament_type": "PLA"},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)

    def test_patch(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 200)
            p = printers.get_printer(self.uuid)
            self.assertEqual(p["name"], "random-test-printer-name")

    def test_patch_printer_props(self):
        with ApiTestClient() as c:
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


    def test_patch_api_keychange(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "random-test-printer-name", "api_key": "1234"},
            )
            self.assertEqual(response.status_code, 200)
            p = printers.get_printer(self.uuid)
            self.assertEqual(p["client_props"]["api_key"], "1234")
            # self.assertEqual(mock_session_get.call_count, 1)

    def test_patch_no_token(self):
        with ApiTestClient() as c:
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                json={"name": "random-test-printer-name", "protocol": "https"},
            )
            self.assertEqual(response.status_code, 401)

    def test_patch_bad_token(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": "random-test-printer-name", "protocol": "https"},
            )
            self.assertEqual(response.status_code, 403)

    def test_patch_unknown_org(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printers/%s"
                % self.uuid,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_patch_no_org_member(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_patch_org_mismatch(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG2, self.uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_patch_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/random-unknown-printer" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 400)

    def test_patch_unknown(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/4d303a17-5310-4515-ba6e-997d297e7e64"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "random-test-printer-name"},
            )
            self.assertEqual(response.status_code, 404)

    def test_patch_no_data(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_patch_empty_name(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/printers/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": ""},
            )
            self.assertEqual(response.status_code, 400)


class CurrentJobRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid,
            ip="192.168.%s" % ".".join([str(random.randint(0, 255)) for _ in range(2)]),
            hostname="hostname",
            client="octoprint",
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={"version": "123", "connected": True},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)

    def test_current_job_no_token(self):
        with ApiTestClient() as c:
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 401)





    def test_current_job_bad_action(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_current_job_unknown_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/4d378856-8f57-4a91-804b-e862784719e4/current-job"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 404)

    def test_current_job_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/random-unknown-printer/current-job"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 400)

    def test_current_job_no_data(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_current_job_empty_action(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/current-job" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": ""},
            )
            self.assertEqual(response.status_code, 400)


class PrinterConnectionRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid,
            ip="192.168.%s" % ".".join([str(random.randint(0, 255)) for _ in range(2)]),
            hostname="hostname",
            client="octoprint",
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={"version": "123", "connected": True},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)



    def test_change_connection_bad_token(self):
        with ApiTestClient() as c:
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
        with ApiTestClient() as c:
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                json={"state": "online"},
            )
            self.assertEqual(response.status_code, 401)

    def test_change_connection_bad_state(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"state": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_change_connection_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/random-unknown-printer/connection",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 400)

    def test_change_connection_unknown_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/2a7d5416-9f49-4bec-8b80-f9a45e5bf3b4/connection"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"action": "cancel"},
            )
            self.assertEqual(response.status_code, 404)

    def test_change_connection_no_data(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_change_connection_empty_state(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/connection" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"state": ""},
            )
            self.assertEqual(response.status_code, 400)


class WebcamSnapshotRoute(unittest.TestCase):
    def test_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/organizations/%s/printers/notuuid/webcam-snapshot" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/organizations/%s/printers/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/webcam-snapshot"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_no_webcam_info(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/organizations/%s/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20/webcam-snapshot"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)


class SetLightsRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid,
            ip="192.168.%s" % ".".join([str(random.randint(0, 255)) for _ in range(2)]),
            hostname="hostname",
            client="octoprint",
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={
                "version": "123",
                "connected": True,
                "plugins": ["awesome_karmen_led"],
            },
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)

    def test_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/notuuid/lights" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/lights"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_lights_unavailable(self):
        with ApiTestClient() as c:
            puid = guid.uuid4()
            printers.add_printer(
                uuid=puid,
                network_client_uuid=self.ncid,
                organization_uuid=UUID_ORG2,
                name="name",
                client_props={"version": "123", "connected": True},
            )
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printers/%s/lights" % (UUID_ORG2, puid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            data = response.json
            self.assertEqual(data["status"], "unavailable")
            self.assertEqual(response.status_code, 200)



class ControlFanRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        self.ip = "192.168.%s" % ".".join(
            [str(random.randint(0, 255)) for _ in range(2)]
        )
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid, ip=self.ip, hostname="hostname", client="octoprint"
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={"version": "123", "connected": True, "plugins": []},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)

    def test_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/notuuid/fan" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/fan"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)


    def test_bad_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/fan" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"target": "something"},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/fan" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)




class ControlMotorsRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        self.ip = "192.168.%s" % ".".join(
            [str(random.randint(0, 255)) for _ in range(2)]
        )
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid, ip=self.ip, hostname="hostname", client="octoprint"
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={"version": "123", "connected": True, "plugins": []},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)

    def test_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/notuuid/motors" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/motors"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)


    def test_bad_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/motors" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"target": "something"},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/motors" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)



class ControlExtrusionRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        self.ip = "192.168.%s" % ".".join(
            [str(random.randint(0, 255)) for _ in range(2)]
        )
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid, ip=self.ip, hostname="hostname", client="octoprint"
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={"version": "123", "connected": True, "plugins": []},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)

    def test_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/notuuid/extrusion" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/v"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)


    def test_bad_amount(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/extrusion" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"amount": "something"},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_amount(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/extrusion" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)




class ControlBedTemperatureRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        self.ip = "192.168.%s" % ".".join(
            [str(random.randint(0, 255)) for _ in range(2)]
        )
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid, ip=self.ip, hostname="hostname", client="octoprint"
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={"version": "123", "connected": True, "plugins": []},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)

    def test_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/notuuid/temperatures/bed" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/v"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)



    def test_bad_tool(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/temperatures/lasergun"
                % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"target": "50"},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/temperatures/bed"
                % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"target": "something"},
            )
            self.assertEqual(response.status_code, 400)

    def test_negative_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/temperatures/bed"
                % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"target": -12},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/temperatures/bed"
                % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)




class ControlTemperaturesRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        self.ip = "192.168.%s" % ".".join(
            [str(random.randint(0, 255)) for _ in range(2)]
        )
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid, ip=self.ip, hostname="hostname", client="octoprint"
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={"version": "123", "connected": True, "plugins": []},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)

    def test_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/notuuid/temperatures/bed" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/v"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)



    def test_bad_part_name(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/temperatures/tool1234"
                % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"target": 6},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/temperatures/bed"
                % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"target": "something"},
            )
            self.assertEqual(response.status_code, 400)

    def test_negative_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/temperatures/bed"
                % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"target": -12},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_target(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/temperatures/bed"
                % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)


class ControlPrintheadRoute(unittest.TestCase):
    def setUp(self):
        self.uuid = guid.uuid4()
        self.ncid = guid.uuid4()
        self.ip = "192.168.%s" % ".".join(
            [str(random.randint(0, 255)) for _ in range(2)]
        )
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)
        network_clients.add_network_client(
            uuid=self.ncid, ip=self.ip, hostname="hostname", client="octoprint"
        )
        printers.add_printer(
            uuid=self.uuid,
            network_client_uuid=self.ncid,
            organization_uuid=UUID_ORG,
            name="name",
            client_props={"version": "123", "connected": True, "plugins": []},
        )

    def tearDown(self):
        printers.delete_printer(self.uuid)
        network_clients.delete_network_client(self.ncid)

    def test_bad_uuid(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/notuuid/printhead" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_printer(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/v"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)



    def test_bad_command(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/printhead" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"command": "something", "x": 1},
            )
            self.assertEqual(response.status_code, 400)

    def test_home_no_axes(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/printhead" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"command": "home"},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_axes(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/printhead" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"command": "home", "axes": ["something"]},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_distance(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/printhead" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"command": "jog", "x": "something"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_command(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/%s/printhead" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"x": 1},
            )
            self.assertEqual(response.status_code, 400)




class IssueTokenRoute(unittest.TestCase):
    def test_issue_token(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/printers/issue-token" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 201)
            self.assertTrue("token" in response.json)
            self.assertTrue(response.json["token"] is not None)

    def test_issue_token_fail_org(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/printers/issue-token",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_issue_token_fail_perms(self):
        with ApiTestClient() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/5ed0c35f-8d69-48c8-8c45-8cd8f93cfc52/printers/issue-token",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)
