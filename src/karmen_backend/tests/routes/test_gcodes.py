import os
import unittest
import tempfile

from server import app
from server.database import gcodes, printjobs

class ListRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_ids = []
        self.gcode_ids.append(gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123
        ))
        self.gcode_ids.append(gcodes.add_gcode(
            path="a/b/dc",
            filename="file2",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123
        ))

    def test_list(self):
        with app.test_client() as c:
            response = c.get('/gcodes')
            self.assertEqual(response.status_code, 200)
            self.assertTrue(len(response.json) >= 2)
            self.assertTrue("id" in response.json[0])
            self.assertTrue("path" in response.json[0])
            self.assertTrue("display" in response.json[0])
            self.assertTrue("absolute_path" in response.json[0])
            self.assertTrue("uploaded" in response.json[0])
            self.assertTrue("size" in response.json[0])
            self.assertTrue("data" in response.json[0])

class DetailRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123
        )

    def test_detail(self):
        with app.test_client() as c:
            response = c.get('/gcodes/%s' % self.gcode_id)
            self.assertEqual(response.status_code, 200)
            self.assertTrue("id" in response.json)
            self.assertEqual(response.json["id"], self.gcode_id)

    def test_404(self):
        with app.test_client() as c:
            response = c.get('/gcodes/172.16')
            self.assertEqual(response.status_code, 404)

# class CreateRoute(unittest.TestCase):
#     @mock.patch('server.services.network.get_avahi_hostname', return_value=None)
#     @mock.patch('server.drivers.octoprint.get_uri', return_value=None)
#     def test_create(self, mock_get_uri, mock_avahi):
#         try:
#             with app.test_client() as c:
#                 response = c.post('/gcodes', json={
#                     "ip": "172.16.236.200:81",
#                     "name": "random-test-printer-name",
#                 })
#                 self.assertEqual(response.status_code, 201)
#                 response = c.get('/gcodes/172.16.236.200:81')
#                 self.assertEqual(response.json["ip"], "172.16.236.200:81")
#                 self.assertEqual(response.json["name"], "random-test-printer-name")
#                 self.assertEqual(response.json["client"]["name"], "octoprint")
#         except Exception as e:
#             raise e
#         finally:
#             c.delete('/gcodes/172.16.236.200:81')

#     def test_empty_req(self):
#         with app.test_client() as c:
#             response = c.post('/gcodes')
#             self.assertEqual(response.status_code, 400)

#     def test_missing_name(self):
#         with app.test_client() as c:
#             response = c.post('/gcodes', json={
#                 "ip": "172.16.236.200",
#             })
#             self.assertEqual(response.status_code, 400)

#     def test_missing_ip(self):
#         with app.test_client() as c:
#             response = c.post('/gcodes', json={
#                 "name": "172.16.236.200",
#             })
#             self.assertEqual(response.status_code, 400)


class DeleteRoute(unittest.TestCase):
    def test_delete(self):
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123
        )
        printjobs.add_printjob(gcode_id=gcode_id, printer_ip="172.16.236.11:8080")
        printjobs.add_printjob(gcode_id=gcode_id, printer_ip="172.16.236.11:8080")
        with app.test_client() as c:
            response = c.delete('/gcodes/%s' % gcode_id)
            self.assertEqual(response.status_code, 204)
        self.assertEqual(gcodes.get_gcode(gcode_id), None)
        self.assertEqual([r for r in printjobs.get_printjobs() if r["gcode_id"] == gcode_id], [])

    def test_delete_unknown(self):
        with app.test_client() as c:
            response = c.delete('/gcodes/172.16')
            self.assertEqual(response.status_code, 404)

class GetDataRoute(unittest.TestCase):
    def test_download(self):
        mock_file = tempfile.NamedTemporaryFile(delete=False)
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path=mock_file.name,
            size=123
        )
        with app.test_client() as c:
            response = c.get('/gcodes/%s/data' % gcode_id)
            self.assertEqual(response.status_code, 200)
        mock_file.close()
        os.remove(mock_file.name)

    def test_get_unknown(self):
        with app.test_client() as c:
            response = c.get('/gcodes/172.16/data')
            self.assertEqual(response.status_code, 404)

    def test_get_not_on_disk(self):
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123
        )
        with app.test_client() as c:
            response = c.get('/gcodes/%s/data' % gcode_id)
            self.assertEqual(response.status_code, 404)
