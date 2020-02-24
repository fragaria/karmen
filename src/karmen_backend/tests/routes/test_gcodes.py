import os
import io
import uuid as uuidmodule
import tempfile
import unittest
from time import time
import mock

from server import app
from server.database import gcodes, printjobs
from ..utils import (
    TOKEN_ADMIN,
    TOKEN_ADMIN_CSRF,
    TOKEN_USER,
    TOKEN_USER_CSRF,
    TOKEN_USER2,
    TOKEN_USER2_CSRF,
    UUID_USER,
    UUID_USER2,
    UUID_ORG,
    UUID_ORG2,
)


class ListRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_uuids = []
        for i in range(0, 5):
            self.gcode_uuids.append(
                gcodes.add_gcode(
                    uuid=uuidmodule.uuid4(),
                    path="a/b/c",
                    filename="file%s" % i,
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                    user_uuid=UUID_USER,
                    organization_uuid=UUID_ORG,
                )
            )

    def test_list_bad_org_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/not-an-uuid/gcodes",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_list_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/gcodes",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_list_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.get(
                "/organizations/%s/gcodes" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_list(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes" % UUID_ORG,
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
            self.assertTrue("path" in response.json["items"][0])
            self.assertTrue("display" in response.json["items"][0])
            self.assertTrue("absolute_path" in response.json["items"][0])
            self.assertTrue("uploaded" in response.json["items"][0])
            self.assertTrue("size" in response.json["items"][0])
            self.assertTrue("data" in response.json["items"][0])
            self.assertTrue(response.json["items"][0]["username"] is not None)

    def test_order_by(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?order_by=filename" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            prev = None
            for code in response.json["items"]:
                if prev:
                    self.assertTrue(code["filename"] >= prev["filename"])
                    # we are ordering implicitly by id ASC as well
                    if code["filename"] == prev["filename"]:
                        self.assertTrue(code["uuid"] >= prev["uuid"])
                prev = code

    def test_limit(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?limit=3&order_by=filename&fields=uuid,filename"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue(
                "/organizations/%s/gcodes?limit=3&order_by=filename&fields=uuid,filename&start_with="
                % UUID_ORG
                in response.json["next"]
            )

    def test_no_multi_order_by(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?limit=3&order_by=uuid,filename" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_start_with(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?limit=3&start_with=2" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue(
                response.json["items"][1]["uuid"] > response.json["items"][0]["uuid"]
            )
            self.assertTrue(
                response.json["items"][2]["uuid"] > response.json["items"][1]["uuid"]
            )
            self.assertTrue(
                ("/organizations/%s/gcodes?limit=3&start_with=" % UUID_ORG)
                in response.json["next"]
            )

    def test_ignore_start_with_str(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?limit=3&start_with=asdfasdf" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_ignore_negative_limit(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?limit=-3" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_start_with_negative(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?limit=3&start_with=-1" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_limit_str(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?limit=asdfasdf&start_with=5" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_filter(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            rand = repr(round(time()))
            gcode_uuids = [
                gcodes.add_gcode(
                    uuid=uuidmodule.uuid4(),
                    path="a/b/c",
                    filename="my-unique-filename-%s" % rand,
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                    user_uuid=UUID_USER,
                    organization_uuid=UUID_ORG,
                ),
                gcodes.add_gcode(
                    uuid=uuidmodule.uuid4(),
                    path="a/b/c",
                    filename="my-unique-filename-%s" % rand,
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                    user_uuid=UUID_USER,
                    organization_uuid=UUID_ORG,
                ),
            ]
            response = c.get(
                "/organizations/%s/gcodes?filter=filename:%s" % (UUID_ORG, rand),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 2)
            for gcode_uuid in gcode_uuids:
                gcodes.delete_gcode(gcode_uuid)

    def test_filter_absent(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?filter=filename:completely-absent%%20filename"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_filter_next(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            gcode_uuids = [
                gcodes.add_gcode(
                    uuid=uuidmodule.uuid4(),
                    path="a/b/c",
                    filename="unique-filename with space.gcode",
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                    user_uuid=UUID_USER,
                    organization_uuid=UUID_ORG,
                ),
                gcodes.add_gcode(
                    uuid=uuidmodule.uuid4(),
                    path="a/b/c",
                    filename="unique-filename with space",
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                    user_uuid=UUID_USER,
                    organization_uuid=UUID_ORG,
                ),
            ]
            response = c.get(
                "/organizations/%s/gcodes?filter=filename:unique-FILENAME with space&limit=1&order_by=-uuid"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 1)
            response2 = c.get(
                response.json["next"], headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertTrue("items" in response2.json)
            self.assertTrue(
                response.json["items"][0]["uuid"] > response2.json["items"][0]["uuid"]
            )
            for gcode_uuid in gcode_uuids:
                gcodes.delete_gcode(gcode_uuid)

    def test_filter_ignore_bad_column(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?filter=random:file1" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)

    def test_filter_ignore_bad_format(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes?filter=file1" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)

    def test_no_token(self):
        with app.test_client() as c:
            response = c.get("/organizations/%s/gcodes")
            self.assertEqual(response.status_code, 401)


class DetailRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_uuid = gcodes.add_gcode(
            uuid=uuidmodule.uuid4(),
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )

    def test_detail(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes/%s" % (UUID_ORG, self.gcode_uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("uuid" in response.json)
            self.assertEqual(response.json["uuid"], self.gcode_uuid)
            self.assertEqual(response.json["user_uuid"], UUID_USER)

    def test_no_token(self):
        with app.test_client() as c:
            response = c.get(
                "/organizations/%s/gcodes/%s" % (UUID_ORG, self.gcode_uuid)
            )
            self.assertEqual(response.status_code, 401)

    def test_list_bad_org_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/not-an-uuid/gcodes/%s" % self.gcode_uuid,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_list_unknown_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/587852aa-9026-4422-852d-2533a92eb506/gcodes/%s"
                % self.gcode_uuid,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_list_no_org_member(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.get(
                "/organizations/%s/gcodes/%s" % (UUID_ORG, self.gcode_uuid),
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_404(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes/5c5da3f2-5213-4ad9-a3dd-21f473709220"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)


class CreateRoute(unittest.TestCase):
    def test_upload_no_token(self):
        with app.test_client() as c:
            data = dict(file=(io.BytesIO(b"my file contents"), "some.gcode"))
            response = c.post(
                "/organizations/%s/gcodes" % UUID_ORG,
                data=data,
                content_type="multipart/form-data",
            )
            self.assertEqual(response.status_code, 401)

    @mock.patch("server.routes.gcodes.analyze_gcode.delay")
    @mock.patch(
        "server.routes.gcodes.files.save",
        return_value={
            "path": "path",
            "filename": "filename",
            "display": "display",
            "absolute_path": "abspath",
            "size": 123,
        },
    )
    def test_upload(self, mocked_save, mocked_delay):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            data = dict(file=(io.BytesIO(b"my file contents"), "some.gcode"))
            response = c.post(
                "/organizations/%s/gcodes" % UUID_ORG,
                data=data,
                content_type="multipart/form-data",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 201)
            args, kwargs = mocked_save.call_args
            self.assertEqual(args[2], "/")
            self.assertEqual(mocked_delay.call_count, 1)

    @mock.patch("server.routes.gcodes.analyze_gcode.delay")
    @mock.patch(
        "server.routes.gcodes.files.save",
        return_value={
            "path": "path",
            "filename": "filename",
            "display": "display",
            "absolute_path": "abspath",
            "size": 123,
        },
    )
    def test_upload_path(self, mocked_save, mocked_delay):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            data = dict(
                file=(io.BytesIO(b"my file contents"), "some.gcode"), path="/a/b"
            )
            response = c.post(
                "/organizations/%s/gcodes" % UUID_ORG,
                data=data,
                content_type="multipart/form-data",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 201)
            args, kwargs = mocked_save.call_args
            self.assertEqual(args[2], "/a/b")
            self.assertTrue("uuid" in response.json)
            self.assertTrue("user_uuid" in response.json)
            self.assertEqual(response.json["user_uuid"], UUID_USER)
            self.assertTrue("path" in response.json)
            self.assertTrue("filename" in response.json)
            self.assertTrue("display" in response.json)
            self.assertTrue("absolute_path" in response.json)
            self.assertTrue("uploaded" in response.json)
            self.assertTrue("size" in response.json)
            gcode_db_data = gcodes.get_gcode(response.json["uuid"])
            self.assertEqual(gcode_db_data["user_uuid"], UUID_USER)

    @mock.patch("server.routes.gcodes.files.save")
    def test_upload_io_error(self, mocked_save):
        mocked_save.side_effect = IOError("Disk problem")
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            data = dict(file=(io.BytesIO(b"my file contents"), "some.gcode"))
            response = c.post(
                "/organizations/%s/gcodes" % UUID_ORG,
                data=data,
                content_type="multipart/form-data",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 500)

    def test_upload_no_file(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/gcodes" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_upload_empty_file(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            data = dict(file=(io.BytesIO(b"my file contents"), ""))
            response = c.post(
                "/organizations/%s/gcodes" % UUID_ORG,
                data=data,
                content_type="multipart/form-data",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_upload_not_gcode(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            data = dict(file=(io.BytesIO(b"my file contents"), "some.txt"))
            response = c.post(
                "/organizations/%s/gcodes" % UUID_ORG,
                data=data,
                content_type="multipart/form-data",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 415)


class DeleteRoute(unittest.TestCase):
    def test_delete(self):
        gcode_uuid = gcodes.add_gcode(
            uuid=uuidmodule.uuid4(),
            path="delete-ab/c",
            filename="delete-gcode-specific-file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )
        printjobs.add_printjob(
            uuid=uuidmodule.uuid4(),
            gcode_uuid=gcode_uuid,
            gcode_data={"uuid": gcode_uuid},
            printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
            printer_data={"host": "172.16.236.11:8080"},
            organization_uuid=UUID_ORG,
        )
        printjobs.add_printjob(
            uuid=uuidmodule.uuid4(),
            gcode_uuid=gcode_uuid,
            gcode_data={"uuid": gcode_uuid},
            printer_uuid="20e91c14-c3e4-4fe9-a066-e69d53324a20",
            printer_data={"host": "172.16.236.11:8080"},
            organization_uuid=UUID_ORG,
        )
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.delete(
                "/organizations/%s/gcodes/%s" % (UUID_ORG, gcode_uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 204)
        self.assertEqual(gcodes.get_gcode(gcode_uuid), None)
        pjs = [
            pj
            for pj in printjobs.get_printjobs(UUID_ORG)
            if pj["gcode_data"]["uuid"] == gcode_uuid
        ]
        self.assertEqual(len(pjs), 2)
        for pj in pjs:
            self.assertFalse(pj["gcode_data"]["available"])

    def test_delete_admin(self):
        gcode_uuid = gcodes.add_gcode(
            uuid=uuidmodule.uuid4(),
            path="delete-ab/c",
            filename="delete-gcode-specific-file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.delete(
                "/organizations/%s/gcodes/%s" % (UUID_ORG, gcode_uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 204)

    def test_delete_org_admin(self):
        gcode_uuid = gcodes.add_gcode(
            uuid=uuidmodule.uuid4(),
            path="delete-ab/c",
            filename="delete-gcode-specific-file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER2,
            organization_uuid=UUID_ORG2,
        )
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.delete(
                "/organizations/%s/gcodes/%s" % (UUID_ORG2, gcode_uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 204)

    def test_delete_bad_user(self):
        gcode_uuid = gcodes.add_gcode(
            uuid=uuidmodule.uuid4(),
            path="delete-ab/c",
            filename="delete-gcode-specific-file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.delete(
                "/organizations/%s/gcodes/%s" % (UUID_ORG, gcode_uuid),
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_delete_no_token(self):
        gcode_uuid = gcodes.add_gcode(
            uuid=uuidmodule.uuid4(),
            path="delete-ab/c",
            filename="delete-gcode-specific-file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )
        with app.test_client() as c:
            response = c.delete("/organizations/%s/gcodes/%s" % (UUID_ORG, gcode_uuid))
            self.assertEqual(response.status_code, 401)

    def test_delete_unknown(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.delete(
                "/organizations/%s/gcodes/5c5da3f2-5213-4ad9-a3dd-21f473709220"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)


class GetDataRoute(unittest.TestCase):
    def test_download_no_token(self):
        with app.test_client() as c:
            response = c.get("/organizations/%s/gcodes/12/data" % UUID_ORG)
            self.assertEqual(response.status_code, 401)

    def test_download(self):
        mock_file = tempfile.NamedTemporaryFile(delete=False)
        gcode_uuid = gcodes.add_gcode(
            uuid=uuidmodule.uuid4(),
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path=mock_file.name,
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes/%s/data" % (UUID_ORG, gcode_uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
        mock_file.close()
        os.remove(mock_file.name)

    def test_get_unknown(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes/5c5da3f2-5213-4ad9-a3dd-21f473709220/data"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_get_not_on_disk(self):
        gcode_uuid = gcodes.add_gcode(
            uuid=uuidmodule.uuid4(),
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
            user_uuid=UUID_USER,
            organization_uuid=UUID_ORG,
        )
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/gcodes/%s/data" % (UUID_ORG, gcode_uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)
