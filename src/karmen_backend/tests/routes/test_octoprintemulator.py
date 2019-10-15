import io
import unittest
import mock

from server import app

class VersionRoute(unittest.TestCase):
    def test_version(self):
        with app.test_client() as c:
            response = c.get('/octoprint-emulator/api/version')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("api" in response.json)
            self.assertTrue("server" in response.json)
            self.assertTrue("text" in response.json)
            self.assertTrue("OctoPrint" in response.json["text"])

class FilesLocalRoute(unittest.TestCase):
    @mock.patch("server.routes.octoprintemulator.files.save", return_value={
        "path": "path",
        "filename": "filename",
        "display": "display",
        "absolute_path": "abspath",
        "size": 123
    })
    def test_upload(self, mocked_save):
        with app.test_client() as c:
            data = dict(
                file=(io.BytesIO(b'my file contents'), "some.gcode"),
            )
            response = c.post('/octoprint-emulator/api/files/local', data=data, content_type='multipart/form-data')
            self.assertEqual(response.status_code, 201)
            args, kwargs = mocked_save.call_args
            self.assertEqual(args[1], '/')

    @mock.patch("server.routes.octoprintemulator.files.save", return_value={
        "path": "path",
        "filename": "filename",
        "display": "display",
        "absolute_path": "abspath",
        "size": 123
    })
    def test_upload_path(self, mocked_save):
        with app.test_client() as c:
            data = dict(
                file=(io.BytesIO(b'my file contents'), "some.gcode"),
                path='/a/b'
            )
            response = c.post('/octoprint-emulator/api/files/local', data=data, content_type='multipart/form-data')
            self.assertEqual(response.status_code, 201)
            args, kwargs = mocked_save.call_args
            self.assertEqual(args[1], '/a/b')
            self.assertTrue("files" in response.json)
            self.assertTrue("local" in response.json["files"])
            self.assertEqual(response.json["files"]["local"]["display"], "display")
            self.assertEqual(response.json["files"]["local"]["name"], "filename")
            self.assertEqual(response.json["files"]["local"]["path"], "abspath")
            self.assertEqual(response.json["files"]["local"]["origin"], "local")

    @mock.patch("server.routes.octoprintemulator.files.save")
    def test_upload_io_error(self, mocked_save):
        mocked_save.side_effect = IOError('Disk problem')
        with app.test_client() as c:
            data = dict(
                file=(io.BytesIO(b'my file contents'), "some.gcode"),
            )
            response = c.post('/octoprint-emulator/api/files/local', data=data, content_type='multipart/form-data')
            self.assertEqual(response.status_code, 500)

    def test_upload_no_file(self):
        with app.test_client() as c:
            response = c.post('/octoprint-emulator/api/files/local')
            self.assertEqual(response.status_code, 400)

    def test_upload_empty_file(self):
        with app.test_client() as c:
            data = dict(
                file=(io.BytesIO(b'my file contents'), ""),
            )
            response = c.post('/octoprint-emulator/api/files/local', data=data, content_type='multipart/form-data')
            self.assertEqual(response.status_code, 400)
    def test_upload_not_gcode(self):
        with app.test_client() as c:
            data = dict(
                file=(io.BytesIO(b'my file contents'), "some.txt"),
            )
            response = c.post('/octoprint-emulator/api/files/local', data=data, content_type='multipart/form-data')
            self.assertEqual(response.status_code, 415)
