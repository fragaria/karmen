import unittest
import mock

from server import app
from server.database import gcodes, printjobs
from server.drivers.utils import PrinterDriverException

class ListRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123
        )
        self.gcode_id2 = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123
        )
        self.printjob_ids = []
        for i in range(0, 3):
            self.printjob_ids.append(printjobs.add_printjob(gcode_id=self.gcode_id, printer_ip="172.16.236.11:8080"))
        for i in range(0, 3):
            self.printjob_ids.append(printjobs.add_printjob(gcode_id=self.gcode_id2, printer_ip="172.16.236.12:8080"))

    def test_list(self):
        with app.test_client() as c:
            response = c.get('/printjobs')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            if len(response.json["items"]) < 200:
                self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            self.assertTrue("id" in response.json["items"][0])
            self.assertTrue("gcode_id" in response.json["items"][0])
            self.assertTrue("printer_ip" in response.json["items"][0])
            self.assertTrue("started" in response.json["items"][0])

    def test_order_by(self):
        with app.test_client() as c:
            response = c.get('/printjobs?order_by=gcode_id')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            prev = None
            for code in response.json["items"]:
                if prev:
                    self.assertTrue(code["gcode_id"] >= prev["gcode_id"])
                    # we are ordering implicitly by id ASC as well
                    if code["gcode_id"] == prev["gcode_id"]:
                        self.assertTrue(code["id"] >= prev["id"])
                prev = code

    def test_limit(self):
        with app.test_client() as c:
            response = c.get('/printjobs?limit=3&order_by=gcode_id&fields=id,gcode_id')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue("/printjobs?limit=3&order_by=gcode_id&fields=id,gcode_id&start_with=" in response.json["next"])

    def test_no_multi_order_by(self):
        with app.test_client() as c:
            response = c.get('/printjobs?limit=3&order_by=id,gcode_id')
            self.assertEqual(response.status_code, 400)

    def test_start_with(self):
        with app.test_client() as c:
            response = c.get('/printjobs?limit=2&start_with=2')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 2)
            self.assertTrue(response.json["items"][0]["id"] >= 2)
            self.assertTrue(response.json["items"][1]["id"] > response.json["items"][0]["id"])
            self.assertEqual(response.json["next"], "/printjobs?limit=2&start_with=%s" % str(int(response.json["items"][1]["id"]) + 1))

    def test_start_with_non_existent(self):
        with app.test_client() as c:
            response = c.get('/printjobs?limit=3&start_with=99999&order_by=started')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_start_with_order_by(self):
        with app.test_client() as c:
            response = c.get('/printjobs?limit=3&start_with=3&order_by=-id')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) == 1)

            response = c.get('/printjobs?limit=3&start_with=1&order_by=id')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue(response.json["items"][1]["id"] > response.json["items"][0]["id"])
            self.assertTrue(response.json["items"][2]["id"] > response.json["items"][1]["id"])

    def test_ignore_start_with_str(self):
        with app.test_client() as c:
            response = c.get('/printjobs?limit=3&start_with=asdfasdf')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_ignore_negative_limit(self):
        with app.test_client() as c:
            response = c.get('/printjobs?limit=-3')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_start_with_negative(self):
        with app.test_client() as c:
            response = c.get('/printjobs?limit=3&start_with=-1')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_limit_str(self):
        with app.test_client() as c:
            response = c.get('/printjobs?limit=asdfasdf&start_with=5')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_filter_absent(self):
        with app.test_client() as c:
            response = c.get('/printjobs?filter=printer_ip:completely-absent%printer')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_filter(self):
        with app.test_client() as c:
            response = c.get('/printjobs?filter=printer_ip:172.16.236.12:8080')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            for printer in response.json["items"]:
                self.assertTrue(printer["printer_ip"], "172.16.236.12:8080")

    def test_filter_next(self):
        with app.test_client() as c:
            response = c.get('/printjobs?filter=printer_ip:172.16.236.12:8080&limit=10&order_by=-id')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 10)
            response2 = c.get(response.json["next"])
            self.assertTrue("items" in response2.json)
            self.assertTrue(response.json["items"][0]["id"] > response2.json["items"][0]["id"])

    def test_filter_ignore_bad_column(self):
        with app.test_client() as c:
            response = c.get('/printjobs?filter=random:file1')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)

    def test_filter_ignore_bad_format(self):
        with app.test_client() as c:
            response = c.get('/printjobs?filter=file1')
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
            size=123
        )
        self.printjob_id = printjobs.add_printjob(gcode_id=self.gcode_id, printer_ip="172.16.236.11:8080")

    def test_detail(self):
        with app.test_client() as c:
            response = c.get('/printjobs/%s' % self.printjob_id)
            self.assertEqual(response.status_code, 200)
            self.assertTrue("id" in response.json)
            self.assertEqual(response.json["id"], self.printjob_id)
            self.assertTrue("gcode_id" in response.json)
            self.assertTrue("printer_ip" in response.json)

    def test_404(self):
        with app.test_client() as c:
            response = c.get('/printjobs/172.16')
            self.assertEqual(response.status_code, 404)

class CreateRoute(unittest.TestCase):

    def setUp(self):
        self.gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123
        )

    @mock.patch('server.routes.printjobs.drivers.get_printer_instance')
    def test_create(self, mock_print_inst):
        mock_print_inst.return_value.upload_and_start_job.return_value = True
        with app.test_client() as c:
            response = c.post('/printjobs', json={
                "printer": "172.16.236.11:8080",
                "gcode": self.gcode_id,
            })
            self.assertEqual(response.status_code, 201)
            pid = response.json["id"]
            pj = printjobs.get_printjob(pid)
            self.assertEqual(pj["gcode_id"], self.gcode_id)
            self.assertEqual(pj["printer_ip"], "172.16.236.11:8080")
            c_args, c_kwargs = mock_print_inst.return_value.upload_and_start_job.call_args
            self.assertEqual(c_args[0], "/ab/a/b/c")
            self.assertEqual(c_args[1], "a/b/c")

    @mock.patch('server.routes.printjobs.drivers.get_printer_instance')
    def test_create_already_printing(self, mock_print_inst):
        mock_print_inst.return_value.upload_and_start_job.side_effect = PrinterDriverException('Printer is printing')
        with app.test_client() as c:
            response = c.post('/printjobs', json={
                "printer": "172.16.236.11:8080",
                "gcode": self.gcode_id,
            })
            self.assertEqual(response.status_code, 409)

    def test_empty_req(self):
        with app.test_client() as c:
            response = c.post('/printjobs')
            self.assertEqual(response.status_code, 400)

    def test_missing_gcode(self):
        with app.test_client() as c:
            response = c.post('/printjobs', json={
                "printer": "172.16.236.11:8080",
            })
            self.assertEqual(response.status_code, 400)

    def test_missing_printer(self):
        with app.test_client() as c:
            response = c.post('/printjobs', json={
                "gcode": self.gcode_id,
            })
            self.assertEqual(response.status_code, 400)

    def test_bad_printer(self):
        with app.test_client() as c:
            response = c.post('/printjobs', json={
                "gcode": self.gcode_id,
                "printer": "123"
            })
            self.assertEqual(response.status_code, 404)

    def test_bad_gcode(self):
        with app.test_client() as c:
            response = c.post('/printjobs', json={
                "gcode": -3,
                "printer": "172.16.236.11:8080",
            })
            self.assertEqual(response.status_code, 404)

    def test_cannot_upload(self):
        with app.test_client() as c:
            response = c.post('/printjobs', json={
                "gcode": self.gcode_id,
                "printer": "172.16.236.11:8080",
            })
            self.assertEqual(response.status_code, 500)

class DeleteRoute(unittest.TestCase):
    def test_delete(self):
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123
        )
        printjob_id = printjobs.add_printjob(gcode_id=gcode_id, printer_ip="172.16.236.11:8080")
        with app.test_client() as c:
            response = c.delete('/printjobs/%s' % printjob_id)
            self.assertEqual(response.status_code, 204)
        self.assertEqual(printjobs.get_printjob(printjob_id), None)

    def test_delete_unknown(self):
        with app.test_client() as c:
            response = c.delete('/printjobs/172.16')
            self.assertEqual(response.status_code, 404)
