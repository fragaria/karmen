import unittest
import mock
import uuid as guid

from server import app
from server.database import gcodes, printjobs, printers
from server.clients.utils import PrinterClientException
from ..utils import (
    TOKEN_USER,
    TOKEN_USER_CSRF,
    TOKEN_USER2,
    TOKEN_USER2_CSRF,
    UUID_USER,
    UUID_ORG,
    UUID_ORG2,
)


class ListRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_uuid = gcodes.add_gcode(
            uuid=guid.uuid4(),
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )
        self.gcode_uuid2 = gcodes.add_gcode(
            uuid=guid.uuid4(),
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )
        uuids = []
        for i in range(0, 7):
            uuids.append(guid.uuid4())
        uuids.sort(reverse=True)
        self.printjob_ids = []
        for i in range(0, 3):
            self.printjob_ids.append(
                printjobs.add_printjob(
                    uuid=uuids.pop(),
                    gcode_uuid=self.gcode_uuid,
                    gcode_data={"uuid": self.gcode_uuid},
                    printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
                    printer_data={"ip": "172.16.236.11", "port": 8080},
                    user_uuid=UUID_USER,
                    organization_uuid=UUID_ORG,
                )
            )
        for i in range(0, 3):
            self.printjob_ids.append(
                printjobs.add_printjob(
                    uuid=uuids.pop(),
                    gcode_uuid=self.gcode_uuid2,
                    gcode_data={"uuid": self.gcode_uuid2},
                    printer_uuid="e24a9711-aabc-48f0-b790-eac056c43f07",
                    printer_data={"ip": "172.16.236.12", "port": 8080},
                    user_uuid=UUID_USER,
                    organization_uuid=UUID_ORG,
                )
            )
        printjobs.add_printjob(
            uuid=uuids.pop(),
            gcode_uuid=self.gcode_uuid2,
            gcode_data={"uuid": self.gcode_uuid2},
            printer_uuid="7e5129ad-08d0-42d1-b65c-847d3c636157",
            printer_data={"ip": "172.16.236.12", "port": 8080},
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG2,
        )

    def test_list_no_token(self):
        with app.test_client() as c:
            response = c.get("/organizations/%s/printjobs" % UUID_ORG)
            self.assertEqual(response.status_code, 401)

    def test_list_bad_org_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/not-an-uuid/printjobs",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_list_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printjobs",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_list_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.get(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_list(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            if len(response.json["items"]) < 200:
                self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            self.assertTrue("uuid" in response.json["items"][0])
            self.assertTrue("user_uuid" in response.json["items"][0])
            self.assertTrue("username" in response.json["items"][0])
            self.assertTrue("gcode_data" in response.json["items"][0])
            self.assertTrue("printer_data" in response.json["items"][0])
            self.assertTrue("started" in response.json["items"][0])
            for item in response.json["items"]:
                printer = printers.get_printer(item["printer_uuid"])
                self.assertEqual(printer["organization_uuid"], UUID_ORG)

    def test_order_by(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?order_by=started" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            prev = None
            for code in response.json["items"]:
                if prev:
                    self.assertTrue(code["started"] >= prev["started"])
                    # we are ordering implicitly by id ASC as well
                    if code["started"] == prev["started"]:
                        self.assertTrue(code["uuid"] >= prev["uuid"])
                prev = code

    def test_limit(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?limit=3&order_by=started&fields=uuid,started"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue(
                "/organizations/%s/printjobs?limit=3&order_by=started&fields=uuid,started&start_with="
                % UUID_ORG
                in response.json["next"]
            )

    def test_no_multi_order_by(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?limit=3&order_by=uuid,started" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_start_with(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?limit=2&start_with=%s"
                % (UUID_ORG, self.printjob_ids[0]),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 2)
            self.assertTrue(
                response.json["items"][1]["uuid"] > response.json["items"][0]["uuid"]
            )
            self.assertTrue(
                ("/organizations/%s/printjobs?limit=2&start_with=" % UUID_ORG)
                in response.json["next"]
            )

    def test_fail_start_with_str(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?limit=3&start_with=asdfasdf" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_negative_limit(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?limit=-3" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_start_with_negative(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?limit=3&start_with=-1" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_start_with_not_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?limit=3&start_with=definitelly not uuid"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_limit_str(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?limit=asdfasdf&start_with=5" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_filter_absent(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?filter=printer_uuid:completely-absent-printer"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_filter(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?filter=printer_uuid:e24a9711-aabc-48f0-b790-eac056c43f07&order_by=uuid"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            for job in response.json["items"]:
                self.assertTrue(
                    job["printer_uuid"], "e24a9711-aabc-48f0-b790-eac056c43f07"
                )
            response = c.get(
                "/organizations/%s/printjobs?filter=gcode_uuid:3:8080&order_by=uuid"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            for job in response.json["items"]:
                self.assertTrue(job["gcode_data"]["uuid"], "3")

    def test_filter_next(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?filter=printer_uuid:e24a9711-aabc-48f0-b790-eac056c43f07&limit=10&order_by=-uuid"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 10)
            response2 = c.get(
                response.json["next"], headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response2.status_code, 200)
            self.assertTrue("items" in response2.json)
            self.assertTrue(
                response.json["items"][0]["uuid"] > response2.json["items"][0]["uuid"]
            )

    def test_filter_ignore_bad_column(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?filter=random:file1" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)

    def test_filter_ignore_bad_format(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs?filter=file1" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)


class DetailRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_uuid = gcodes.add_gcode(
            uuid=guid.uuid4(),
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )
        self.printjob_id = printjobs.add_printjob(
            uuid=guid.uuid4(),
            gcode_uuid=self.gcode_uuid,
            gcode_data={"uuid": self.gcode_uuid},
            printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
            printer_data={"ip": "172.16.236.11", "port": 8080},
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )

    def test_detail_no_token(self):
        with app.test_client() as c:
            response = c.get(
                "/organizations/%s/printjobs/%s" % (UUID_ORG, self.printjob_id)
            )
            self.assertEqual(response.status_code, 401)

    def test_detail_bad_org_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/not-an-uuid/printjobs/%s" % self.printjob_id,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_detail_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printjobs/%s"
                % self.printjob_id,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_detail_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.get(
                "/organizations/%s/printjobs/%s" % (UUID_ORG, self.printjob_id),
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_detail_org_mismatch(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs/%s" % (UUID_ORG2, self.printjob_id),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_detail(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs/%s" % (UUID_ORG, self.printjob_id),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("uuid" in response.json)
            self.assertEqual(response.json["uuid"], self.printjob_id)
            self.assertTrue("gcode_data" in response.json)
            self.assertTrue("printer_data" in response.json)

    def test_404(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/printjobs/8109969e-be01-4180-8ef0-d900b101add6"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)


class CreateRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_uuid = gcodes.add_gcode(
            uuid=guid.uuid4(),
            path="a/b/c",
            filename="file",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )

    @mock.patch("server.routes.printjobs.clients.get_printer_instance")
    def test_create(self, mock_print_inst):
        mock_print_inst.return_value.upload_and_start_job.return_value = True
        mock_print_inst.return_value.ip = "1.2.3.4"
        mock_print_inst.return_value.port = 1234
        mock_print_inst.return_value.hostname = "hostname.local"
        mock_print_inst.return_value.name = "my-printer"
        mock_print_inst.return_value.client = "octoprint"
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20",
                    "gcode": self.gcode_uuid,
                },
            )
            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.json["user_uuid"], UUID_USER)
            pid = response.json["uuid"]
            pj = printjobs.get_printjob(pid)
            self.assertEqual(pj["gcode_uuid"], self.gcode_uuid)
            self.assertEqual(pj["user_uuid"], UUID_USER)
            self.assertEqual(pj["printer_uuid"], "20e91c14-c3e4-4fe9-a066-e69d53324a20")
            self.assertFalse(pj["printer_data"] is None)
            self.assertFalse(pj["gcode_data"] is None)
            self.assertTrue("name" in pj["printer_data"])
            self.assertTrue("filename" in pj["gcode_data"])
            self.assertTrue("available" in pj["gcode_data"])
            self.assertTrue(pj["gcode_data"]["available"])
            (
                c_args,
                c_kwargs,
            ) = mock_print_inst.return_value.upload_and_start_job.call_args
            self.assertEqual(c_args[0], "/ab/a/b/c")
            self.assertEqual(c_args[1], "a/b/c")

    @mock.patch("server.routes.printjobs.clients.get_printer_instance")
    def test_create_already_printing(self, mock_print_inst):
        mock_print_inst.return_value.upload_and_start_job.side_effect = PrinterClientException(
            "Printer is printing"
        )
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20",
                    "gcode": self.gcode_uuid,
                },
            )
            self.assertEqual(response.status_code, 409)

    def test_empty_req(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_create_bad_org_printer(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20",
                    "gcode": self.gcode_uuid,
                },
            )
            self.assertEqual(response.status_code, 404)

    def test_create_bad_org_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/not-an-uuid/printjobs",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_create_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/printjobs",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_create_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_missing_gcode(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_printer(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"gcode": self.gcode_uuid},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_printer(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "gcode": self.gcode_uuid,
                    "printer": "225b4a63-d94a-4231-87dc-f1bff717e5da",
                },
            )
            self.assertEqual(response.status_code, 404)

    def test_bad_gcode(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"gcode": -3, "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20"},
            )
            self.assertEqual(response.status_code, 400)

    def test_nonexistent_gcode(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "gcode": "c0b2f373-4d1a-4d3e-a4ed-1f09a4d1b9d3",
                    "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20",
                },
            )
            self.assertEqual(response.status_code, 404)

    @mock.patch(
        "server.routes.printjobs.clients.get_printer_instance", return_value=None
    )
    def test_cannot_upload_to_printer(self, mock_get_printer):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/printjobs" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "gcode": self.gcode_uuid,
                    "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20",
                },
            )
            self.assertEqual(response.status_code, 500)
