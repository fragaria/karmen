import io
import unittest
import mock

from ..utils import TOKEN_ADMIN_EXPIRED, API_TOKEN_USER, UUID_USER, ApiTestClient


class VersionRoute(unittest.TestCase):
    def test_version_no_token(self):
        with ApiTestClient() as c:
            response = c.get("/octoprint-emulator/api/version")
            self.assertEqual(response.status_code, 403)

    def test_version_expired_token(self):
        with ApiTestClient() as c:
            response = c.get(
                "/octoprint-emulator/api/version",
                headers={"X-Api-Key": TOKEN_ADMIN_EXPIRED},
            )
            self.assertEqual(response.status_code, 403)

    def test_version(self):
        with ApiTestClient() as c:
            response = c.get(
                "/octoprint-emulator/api/version", headers={"X-Api-Key": API_TOKEN_USER}
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("api" in response.json)
            self.assertTrue("server" in response.json)
            self.assertTrue("text" in response.json)
            self.assertTrue("OctoPrint" in response.json["text"])


class SettingsRoute(unittest.TestCase):
    def test_settings_no_token(self):
        with ApiTestClient() as c:
            response = c.get("/octoprint-emulator/api/settings")
            self.assertEqual(response.status_code, 403)

    def test_settings_expired_token(self):
        with ApiTestClient() as c:
            response = c.get(
                "/octoprint-emulator/api/settings",
                headers={"X-Api-Key": TOKEN_ADMIN_EXPIRED},
            )
            self.assertEqual(response.status_code, 403)

    def test_settings(self):
        with ApiTestClient() as c:
            response = c.get(
                "/octoprint-emulator/api/settings",
                headers={"X-Api-Key": API_TOKEN_USER},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue(len(response.json) == 0)


class JobRoute(unittest.TestCase):
    def test_job_no_token(self):
        with ApiTestClient() as c:
            response = c.get("/octoprint-emulator/api/job")
            self.assertEqual(response.status_code, 403)

    def test_job_expired_token(self):
        with ApiTestClient() as c:
            response = c.get(
                "/octoprint-emulator/api/job",
                headers={"X-Api-Key": TOKEN_ADMIN_EXPIRED},
            )
            self.assertEqual(response.status_code, 403)

    def test_job(self):
        with ApiTestClient() as c:
            response = c.get(
                "/octoprint-emulator/api/job", headers={"X-Api-Key": API_TOKEN_USER}
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("job" in response.json)
            self.assertTrue(response.json["job"] == {})


class PrinterRoute(unittest.TestCase):
    def test_printer_no_token(self):
        with ApiTestClient() as c:
            response = c.get("/octoprint-emulator/api/printer")
            self.assertEqual(response.status_code, 403)

    def test_printer_expired_token(self):
        with ApiTestClient() as c:
            response = c.get(
                "/octoprint-emulator/api/printer",
                headers={"X-Api-Key": TOKEN_ADMIN_EXPIRED},
            )
            self.assertEqual(response.status_code, 403)

    def test_printer(self):
        with ApiTestClient() as c:
            response = c.get(
                "/octoprint-emulator/api/printer", headers={"X-Api-Key": API_TOKEN_USER}
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("sd" in response.json)
            self.assertTrue("ready" in response.json["sd"])
            self.assertTrue(response.json["sd"]["ready"] == True)
            self.assertTrue("state" in response.json)
            self.assertTrue("text" in response.json["state"])
            self.assertTrue("Operational" == response.json["state"]["text"])


class FilesLocalRoute(unittest.TestCase):
    @mock.patch("server.routes.gcodes.analyze_gcode.delay")
    @mock.patch(
        "server.routes.octoprintemulator.files.save",
        return_value={
            "path": "path",
            "filename": "filename",
            "display": "display",
            "absolute_path": "abspath",
            "size": 123,
        },
    )
    def test_upload(self, mocked_save, mocked_delay):
        with ApiTestClient() as c:
            data = dict(file=(io.BytesIO(b"my file contents"), "some.gcode"))
            response = c.post(
                "/octoprint-emulator/api/files/local",
                data=data,
                content_type="multipart/form-data",
                headers={"X-Api-Key": API_TOKEN_USER},
            )
            self.assertEqual(response.status_code, 201)
            args, kwargs = mocked_save.call_args
            self.assertEqual(args[2], "")
            self.assertEqual(mocked_delay.call_count, 1)

    @mock.patch("server.routes.gcodes.gcodes.add_gcode")
    @mock.patch("server.routes.gcodes.analyze_gcode.delay")
    @mock.patch(
        "server.routes.octoprintemulator.files.save",
        return_value={
            "path": "path",
            "filename": "filename",
            "display": "display",
            "absolute_path": "abspath",
            "size": 123,
        },
    )
    def test_upload_path(self, mocked_save, mocked_delay, mocked_db_save):
        with ApiTestClient() as c:
            data = dict(
                file=(io.BytesIO(b"my file contents"), "some.gcode"), path="/a/b"
            )
            response = c.post(
                "/octoprint-emulator/api/files/local",
                data=data,
                content_type="multipart/form-data",
                headers={"X-Api-Key": API_TOKEN_USER},
            )
            self.assertEqual(response.status_code, 201)
            args, kwargs = mocked_save.call_args
            self.assertEqual(args[2], "/a/b")
            self.assertTrue("files" in response.json)
            self.assertTrue("local" in response.json["files"])
            self.assertEqual(response.json["files"]["local"]["display"], "display")
            self.assertEqual(response.json["files"]["local"]["name"], "filename")
            self.assertEqual(response.json["files"]["local"]["path"], "abspath")
            self.assertEqual(response.json["files"]["local"]["origin"], "local")
            args, kwargs = mocked_db_save.call_args
            self.assertEqual(kwargs["user_uuid"], UUID_USER)

    @mock.patch("server.routes.octoprintemulator.files.save")
    def test_upload_io_error(self, mocked_save):
        mocked_save.side_effect = IOError("Disk problem")
        with ApiTestClient() as c:
            data = dict(file=(io.BytesIO(b"my file contents"), "some.gcode"))
            response = c.post(
                "/octoprint-emulator/api/files/local",
                data=data,
                content_type="multipart/form-data",
                headers={"X-Api-Key": API_TOKEN_USER},
            )
            self.assertEqual(response.status_code, 500)

    def test_version_no_token(self):
        with ApiTestClient() as c:
            data = dict(
                file=(io.BytesIO(b"my file contents"), "some.gcode"), path="/a/b"
            )
            response = c.post(
                "/octoprint-emulator/api/files/local",
                data=data,
                content_type="multipart/form-data",
            )
            self.assertEqual(response.status_code, 403)

    def test_version_expired_token(self):
        with ApiTestClient() as c:
            data = dict(
                file=(io.BytesIO(b"my file contents"), "some.gcode"), path="/a/b"
            )
            response = c.post(
                "/octoprint-emulator/api/files/local",
                headers={"X-Api-Key": TOKEN_ADMIN_EXPIRED},
                data=data,
                content_type="multipart/form-data",
            )
            self.assertEqual(response.status_code, 403)

    def test_upload_no_file(self):
        with ApiTestClient() as c:
            response = c.post(
                "/octoprint-emulator/api/files/local",
                headers={"X-Api-Key": API_TOKEN_USER},
            )
            self.assertEqual(response.status_code, 400)

    def test_upload_empty_file(self):
        with ApiTestClient() as c:
            data = dict(file=(io.BytesIO(b"my file contents"), ""))
            response = c.post(
                "/octoprint-emulator/api/files/local",
                data=data,
                content_type="multipart/form-data",
                headers={"X-Api-Key": API_TOKEN_USER},
            )
            self.assertEqual(response.status_code, 400)

    def test_upload_not_gcode(self):
        with ApiTestClient() as c:
            data = dict(file=(io.BytesIO(b"my file contents"), "some.txt"))
            response = c.post(
                "/octoprint-emulator/api/files/local",
                data=data,
                content_type="multipart/form-data",
                headers={"X-Api-Key": API_TOKEN_USER},
            )
            self.assertEqual(response.status_code, 415)
