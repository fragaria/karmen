import os
import io
import tempfile
import unittest
from time import time
import mock

from server import app
from server.database import gcodes, printjobs


class ListRoute(unittest.TestCase):
    def setUp(self):
        self.gcode_ids = []
        for i in range(0, 5):
            self.gcode_ids.append(
                gcodes.add_gcode(
                    path="a/b/c",
                    filename="file%s" % i,
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                )
            )

    def test_list(self):
        with app.test_client() as c:
            response = c.get("/gcodes")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            if len(response.json["items"]) < 200:
                self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            self.assertTrue("id" in response.json["items"][0])
            self.assertTrue("path" in response.json["items"][0])
            self.assertTrue("display" in response.json["items"][0])
            self.assertTrue("absolute_path" in response.json["items"][0])
            self.assertTrue("uploaded" in response.json["items"][0])
            self.assertTrue("size" in response.json["items"][0])
            self.assertTrue("data" in response.json["items"][0])

    def test_order_by(self):
        with app.test_client() as c:
            response = c.get("/gcodes?order_by=filename")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            prev = None
            for code in response.json["items"]:
                if prev:
                    self.assertTrue(code["filename"] >= prev["filename"])
                    # we are ordering implicitly by id ASC as well
                    if code["filename"] == prev["filename"]:
                        self.assertTrue(code["id"] >= prev["id"])
                prev = code

    def test_limit(self):
        with app.test_client() as c:
            response = c.get("/gcodes?limit=3&order_by=filename&fields=id,filename")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue(
                "/gcodes?limit=3&order_by=filename&fields=id,filename&start_with="
                in response.json["next"]
            )

    def test_no_multi_order_by(self):
        with app.test_client() as c:
            response = c.get("/gcodes?limit=3&order_by=id,filename")
            self.assertEqual(response.status_code, 400)

    def test_start_with(self):
        with app.test_client() as c:
            response = c.get("/gcodes?limit=3&start_with=2")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue(response.json["items"][0]["id"] >= 2)
            self.assertTrue(
                response.json["items"][1]["id"] > response.json["items"][0]["id"]
            )
            self.assertTrue(
                response.json["items"][2]["id"] > response.json["items"][1]["id"]
            )
            self.assertEqual(
                response.json["next"],
                "/gcodes?limit=3&start_with=%s"
                % str(int(response.json["items"][2]["id"]) + 1),
            )

    def test_start_with_non_existent(self):
        with app.test_client() as c:
            response = c.get("/gcodes?limit=3&start_with=99999&order_by=uploaded")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_start_with_order_by(self):
        with app.test_client() as c:
            response = c.get("/gcodes?limit=3&start_with=1&order_by=-id")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) == 1)
            self.assertTrue(response.json["items"][0]["id"] == 1)

            response = c.get("/gcodes?limit=3&start_with=1&order_by=id")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 3)
            self.assertTrue(response.json["items"][0]["id"] == 1)
            self.assertTrue(
                response.json["items"][1]["id"] > response.json["items"][0]["id"]
            )
            self.assertTrue(
                response.json["items"][2]["id"] > response.json["items"][1]["id"]
            )

    def test_ignore_start_with_str(self):
        with app.test_client() as c:
            response = c.get("/gcodes?limit=3&start_with=asdfasdf")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_ignore_negative_limit(self):
        with app.test_client() as c:
            response = c.get("/gcodes?limit=-3")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_start_with_negative(self):
        with app.test_client() as c:
            response = c.get("/gcodes?limit=3&start_with=-1")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_limit_str(self):
        with app.test_client() as c:
            response = c.get("/gcodes?limit=asdfasdf&start_with=5")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_filter(self):
        with app.test_client() as c:
            rand = repr(round(time()))
            gcode_ids = [
                gcodes.add_gcode(
                    path="a/b/c",
                    filename="my-unique-filename-%s" % rand,
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                ),
                gcodes.add_gcode(
                    path="a/b/c",
                    filename="my-unique-filename-%s" % rand,
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                ),
            ]
            response = c.get("/gcodes?filter=filename:%s" % rand)
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 2)
            for gcode_id in gcode_ids:
                gcodes.delete_gcode(gcode_id)

    def test_filter_absent(self):
        with app.test_client() as c:
            response = c.get("/gcodes?filter=filename:completely-absent%20filename")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_filter_next(self):
        with app.test_client() as c:
            gcode_ids = [
                gcodes.add_gcode(
                    path="a/b/c",
                    filename="unique-filename with space.gcode",
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                ),
                gcodes.add_gcode(
                    path="a/b/c",
                    filename="unique-filename with space",
                    display="file-display",
                    absolute_path="/ab/a/b/c",
                    size=123,
                ),
            ]
            response = c.get(
                "/gcodes?filter=filename:unique-FILENAME with space&limit=1&order_by=-id"
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 1)
            response2 = c.get(response.json["next"])
            self.assertTrue("items" in response2.json)
            self.assertTrue(
                response.json["items"][0]["id"] > response2.json["items"][0]["id"]
            )
            for gcode_id in gcode_ids:
                gcodes.delete_gcode(gcode_id)

    def test_filter_ignore_bad_column(self):
        with app.test_client() as c:
            response = c.get("/gcodes?filter=random:file1")
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)

    def test_filter_ignore_bad_format(self):
        with app.test_client() as c:
            response = c.get("/gcodes?filter=file1")
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
        )

    def test_detail(self):
        with app.test_client() as c:
            response = c.get("/gcodes/%s" % self.gcode_id)
            self.assertEqual(response.status_code, 200)
            self.assertTrue("id" in response.json)
            self.assertEqual(response.json["id"], self.gcode_id)

    def test_404(self):
        with app.test_client() as c:
            response = c.get("/gcodes/172.16")
            self.assertEqual(response.status_code, 404)


class CreateRoute(unittest.TestCase):
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
            data = dict(file=(io.BytesIO(b"my file contents"), "some.gcode"))
            response = c.post("/gcodes", data=data, content_type="multipart/form-data")
            self.assertEqual(response.status_code, 201)
            args, kwargs = mocked_save.call_args
            self.assertEqual(args[1], "/")
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
            data = dict(
                file=(io.BytesIO(b"my file contents"), "some.gcode"), path="/a/b"
            )
            response = c.post("/gcodes", data=data, content_type="multipart/form-data")
            self.assertEqual(response.status_code, 201)
            args, kwargs = mocked_save.call_args
            self.assertEqual(args[1], "/a/b")
            self.assertTrue("id" in response.json)
            self.assertTrue("path" in response.json)
            self.assertTrue("filename" in response.json)
            self.assertTrue("display" in response.json)
            self.assertTrue("absolute_path" in response.json)
            self.assertTrue("uploaded" in response.json)
            self.assertTrue("size" in response.json)

    @mock.patch("server.routes.gcodes.files.save")
    def test_upload_io_error(self, mocked_save):
        mocked_save.side_effect = IOError("Disk problem")
        with app.test_client() as c:
            data = dict(file=(io.BytesIO(b"my file contents"), "some.gcode"))
            response = c.post("/gcodes", data=data, content_type="multipart/form-data")
            self.assertEqual(response.status_code, 500)

    def test_upload_no_file(self):
        with app.test_client() as c:
            response = c.post("/gcodes")
            self.assertEqual(response.status_code, 400)

    def test_upload_empty_file(self):
        with app.test_client() as c:
            data = dict(file=(io.BytesIO(b"my file contents"), ""))
            response = c.post("/gcodes", data=data, content_type="multipart/form-data")
            self.assertEqual(response.status_code, 400)

    def test_upload_not_gcode(self):
        with app.test_client() as c:
            data = dict(file=(io.BytesIO(b"my file contents"), "some.txt"))
            response = c.post("/gcodes", data=data, content_type="multipart/form-data")
            self.assertEqual(response.status_code, 415)


class DeleteRoute(unittest.TestCase):
    def test_delete(self):
        gcode_id = gcodes.add_gcode(
            path="delete-ab/c",
            filename="delete-gcode-specific-file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
        )
        printjobs.add_printjob(
            gcode_id=gcode_id,
            gcode_data={"id": gcode_id},
            printer_host="172.16.236.11:8080",
            printer_data={"host": "172.16.236.11:8080"},
        )
        printjobs.add_printjob(
            gcode_id=gcode_id,
            gcode_data={"id": gcode_id},
            printer_host="172.16.236.11:8080",
            printer_data={"host": "172.16.236.11:8080"},
        )
        with app.test_client() as c:
            response = c.delete("/gcodes/%s" % gcode_id)
            self.assertEqual(response.status_code, 204)
        self.assertEqual(gcodes.get_gcode(gcode_id), None)
        pjs = [pj for pj in printjobs.get_printjobs() if pj["gcode_id"] == gcode_id]
        self.assertEqual(len(pjs), 2)
        for pj in pjs:
            self.assertFalse(pj["gcode_data"]["available"])

    def test_delete_unknown(self):
        with app.test_client() as c:
            response = c.delete("/gcodes/172.16")
            self.assertEqual(response.status_code, 404)


class GetDataRoute(unittest.TestCase):
    def test_download(self):
        mock_file = tempfile.NamedTemporaryFile(delete=False)
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path=mock_file.name,
            size=123,
        )
        with app.test_client() as c:
            response = c.get("/gcodes/%s/data" % gcode_id)
            self.assertEqual(response.status_code, 200)
        mock_file.close()
        os.remove(mock_file.name)

    def test_get_unknown(self):
        with app.test_client() as c:
            response = c.get("/gcodes/172.16/data")
            self.assertEqual(response.status_code, 404)

    def test_get_not_on_disk(self):
        gcode_id = gcodes.add_gcode(
            path="a/b/c",
            filename="file1",
            display="file-display",
            absolute_path="/ab/a/b/c",
            size=123,
        )
        with app.test_client() as c:
            response = c.get("/gcodes/%s/data" % gcode_id)
            self.assertEqual(response.status_code, 404)
