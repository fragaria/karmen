import unittest
import mock

from server import app
from server.database import gcodes, printjobs

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
