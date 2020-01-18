import unittest
import mock

from server import app
from server.database import gcodes, printjobs
from server.clients.utils import PrinterClientException
from ..utils import TOKEN_ADMIN, TOKEN_USER, TOKEN_USER2, UUID_USER


class ListRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
        )
        self.gcode_id2 = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
        )
        self.printjob_ids = []
        for i in range(0, 3):
            self.printjob_ids.append(
                printjobs.add_printjob(
                    gcode_id=self.gcode_id,
                    gcode_data={"id": self.gcode_id},
                    printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
                    printer_data={"ip": "172.16.236.11", "port": 8080},
                    user_uuid=UUID_USER,
                )
            )
        for i in range(0, 3):
            self.printjob_ids.append(
                printjobs.add_printjob(
                    gcode_id=self.gcode_id2,
                    gcode_data={"id": self.gcode_id2},
                    printer_uuid="e24a9711-aabc-48f0-b790-eac056c43f07",
                    printer_data={"ip": "172.16.236.12", "port": 8080},
                    user_uuid=UUID_USER,
                )
            )

    def test_list_no_token(self):
        with app.test_client() as c:
            response = c.get("/printjobs")
            self.assertEqual(response.status_code, 401)

    def test_list(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs", headers={"Authorization": "Bearer %s" % TOKEN_USER}
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            if len(response.json["items"]) < 200:
                self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            self.assertTrue("id" in response.json["items"][0])
            self.assertTrue("user_uuid" in response.json["items"][0])
            self.assertTrue("username" in response.json["items"][0])
            self.assertTrue("gcode_data" in response.json["items"][0])
            self.assertTrue("printer_data" in response.json["items"][0])
            self.assertTrue("started" in response.json["items"][0])

    def test_order_by(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?order_by=started",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
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
                        self.assertTrue(code["id"] >= prev["id"])
                prev = code

    def test_limit(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?limit=3&order_by=started&fields=id,started",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue(
                "/printjobs?limit=3&order_by=started&fields=id,started&start_with="
                in response.json["next"]
            )

    def test_no_multi_order_by(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?limit=3&order_by=id,started",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 400)

    def test_start_with(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?limit=2&start_with=2",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 2)
            self.assertTrue(response.json["items"][0]["id"] >= 2)
            self.assertTrue(
                response.json["items"][1]["id"] > response.json["items"][0]["id"]
            )
            self.assertEqual(
                response.json["next"],
                "/printjobs?limit=2&start_with=%s"
                % str(int(response.json["items"][1]["id"]) + 1),
            )

    def test_start_with_non_existent(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?limit=3&start_with=99999&order_by=started",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_start_with_order_by(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?limit=3&start_with=1&order_by=-id",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) == 1)

            response = c.get(
                "/printjobs?limit=3&start_with=1&order_by=id",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue(
                response.json["items"][1]["id"] > response.json["items"][0]["id"]
            )
            self.assertTrue(
                response.json["items"][2]["id"] > response.json["items"][1]["id"]
            )

    def test_ignore_start_with_str(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?limit=3&start_with=asdfasdf",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_ignore_negative_limit(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?limit=-3",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_start_with_negative(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?limit=3&start_with=-1",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_limit_str(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?limit=asdfasdf&start_with=5",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_filter_absent(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?filter=printer_uuid:completely-absent%printer",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_filter(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?filter=printer_uuid:e24a9711-aabc-48f0-b790-eac056c43f07&order_by=id",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            for job in response.json["items"]:
                self.assertTrue(
                    job["printer_uuid"], "e24a9711-aabc-48f0-b790-eac056c43f07"
                )
            response = c.get(
                "/printjobs?filter=gcode_id:3:8080&order_by=id",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            for job in response.json["items"]:
                self.assertTrue(job["gcode_data"]["id"], "3")

    def test_filter_next(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?filter=printer_uuid:e24a9711-aabc-48f0-b790-eac056c43f07&limit=10&order_by=-id",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 10)
            response2 = c.get(
                response.json["next"],
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response2.status_code, 200)
            self.assertTrue("items" in response2.json)
            self.assertTrue(
                response.json["items"][0]["id"] > response2.json["items"][0]["id"]
            )

    def test_filter_ignore_bad_column(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?filter=random:file1",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)

    def test_filter_ignore_bad_format(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs?filter=file1",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)


class DetailRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
        )
        self.printjob_id = printjobs.add_printjob(
            gcode_id=self.gcode_id,
            gcode_data={"id": self.gcode_id},
            printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
            printer_data={"ip": "172.16.236.11", "port": 8080},
            user_uuid=UUID_USER,
        )

    def test_detail_no_token(self):
        with app.test_client() as c:
            response = c.get("/printjobs/%s" % self.printjob_id)
            self.assertEqual(response.status_code, 401)

    def test_detail(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs/%s" % self.printjob_id,
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("id" in response.json)
            self.assertEqual(response.json["id"], self.printjob_id)
            self.assertTrue("gcode_data" in response.json)
            self.assertTrue("printer_data" in response.json)

    def test_404(self):
        with app.test_client() as c:
            response = c.get(
                "/printjobs/172.16", headers={"Authorization": "Bearer %s" % TOKEN_USER}
            )
            self.assertEqual(response.status_code, 404)


class CreateRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
        )

    @mock.patch(
        "server.routes.printjobs.clients.get_printer_instance",
        headers={"Authorization": "Bearer %s" % TOKEN_USER},
    )
    def test_create(self, mock_print_inst):
        mock_print_inst.return_value.upload_and_start_job.return_value = True
        with app.test_client() as c:
            response = c.post(
                "/printjobs",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={
                    "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20",
                    "gcode": self.gcode_id,
                },
            )
            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.json["user_uuid"], UUID_USER)
            pid = response.json["id"]
            pj = printjobs.get_printjob(pid)
            self.assertEqual(pj["gcode_id"], self.gcode_id)
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
            response = c.post(
                "/printjobs",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={
                    "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20",
                    "gcode": self.gcode_id,
                },
            )
            self.assertEqual(response.status_code, 409)

    def test_empty_req(self):
        with app.test_client() as c:
            response = c.post(
                "/printjobs", headers={"Authorization": "Bearer %s" % TOKEN_USER}
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_gcode(self):
        with app.test_client() as c:
            response = c.post(
                "/printjobs",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_printer(self):
        with app.test_client() as c:
            response = c.post(
                "/printjobs",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"gcode": self.gcode_id},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_printer(self):
        with app.test_client() as c:
            response = c.post(
                "/printjobs",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={
                    "gcode": self.gcode_id,
                    "printer": "225b4a63-d94a-4231-87dc-f1bff717e5da",
                },
            )
            self.assertEqual(response.status_code, 404)

    def test_bad_gcode(self):
        with app.test_client() as c:
            response = c.post(
                "/printjobs",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={"gcode": -3, "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20"},
            )
            self.assertEqual(response.status_code, 404)

    def test_cannot_upload(self):
        with app.test_client() as c:
            response = c.post(
                "/printjobs",
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
                json={
                    "gcode": self.gcode_id,
                    "printer": "20e91c14-c3e4-4fe9-a066-e69d53324a20",
                },
            )
            self.assertEqual(response.status_code, 500)


class DeleteRoute(unittest.TestCase):
    def test_delete_no_token(self):
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
        )
        printjob_id = printjobs.add_printjob(
            gcode_id=gcode_id,
            gcode_data={"id": gcode_id},
            printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
            printer_data={"ip": "172.16.236.11", "port": 8080},
            user_uuid=UUID_USER,
        )
        with app.test_client() as c:
            response = c.delete("/printjobs/%s" % printjob_id)
            self.assertEqual(response.status_code, 401)

    def test_delete(self):
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
        )
        printjob_id = printjobs.add_printjob(
            gcode_id=gcode_id,
            gcode_data={"id": gcode_id},
            printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
            printer_data={"ip": "172.16.236.11", "port": 8080},
            user_uuid=UUID_USER,
        )
        with app.test_client() as c:
            response = c.delete(
                "/printjobs/%s" % printjob_id,
                headers={"Authorization": "Bearer %s" % TOKEN_USER},
            )
            self.assertEqual(response.status_code, 204)
        self.assertEqual(printjobs.get_printjob(printjob_id), None)

    def test_delete_admin(self):
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
        )
        printjob_id = printjobs.add_printjob(
            gcode_id=gcode_id,
            gcode_data={"id": gcode_id},
            printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
            printer_data={"host": "172.16.236.11", "port": 8080},
            user_uuid=UUID_USER,
        )
        with app.test_client() as c:
            response = c.delete(
                "/printjobs/%s" % printjob_id,
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(response.status_code, 204)
        self.assertEqual(printjobs.get_printjob(printjob_id), None)

    def test_delete_bad_user(self):
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
        )
        printjob_id = printjobs.add_printjob(
            gcode_id=gcode_id,
            gcode_data={"id": gcode_id},
            printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
            printer_data={"host": "172.16.236.11", "port": 8080},
            user_uuid=UUID_USER,
        )
        with app.test_client() as c:
            response = c.delete(
                "/printjobs/%s" % printjob_id,
                headers={"Authorization": "Bearer %s" % TOKEN_USER2},
            )
            self.assertEqual(response.status_code, 401)

    def test_delete_unknown(self):
        with app.test_client() as c:
            response = c.delete(
                "/printjobs/172.16", headers={"Authorization": "Bearer %s" % TOKEN_USER}
            )
            self.assertEqual(response.status_code, 404)
