import unittest
import mock

from server import app

class ListRoute(unittest.TestCase):
    def test_list(self):
        with app.test_client() as c:
            response = c.get('/printers')
            self.assertEqual(response.status_code, 200)
            # coming from db fixtures
            self.assertEqual(len(response.json), 2)
            self.assertTrue("client" in response.json[0])
            self.assertTrue("webcam" not in response.json[0])
            self.assertTrue("status" not in response.json[0])
            self.assertTrue("job" not in response.json[0])
            self.assertTrue("client" in response.json[1])
            self.assertTrue("webcam" not in response.json[1])
            self.assertTrue("status" not in response.json[1])
            self.assertTrue("job" not in response.json[1])

    @mock.patch('server.models.octoprint.get_uri', return_value=None)
    def test_list_fields(self, mock_get_uri):
        with app.test_client() as c:
            response = c.get('/printers?fields=webcam,status,job')
            self.assertEqual(response.status_code, 200)
            # coming from db fixtures
            self.assertEqual(len(response.json), 2)
            self.assertTrue("client" in response.json[0])
            self.assertTrue("webcam" in response.json[0])
            self.assertTrue("status" in response.json[0])
            self.assertTrue("job" in response.json[0])
            self.assertTrue("client" in response.json[1])
            self.assertTrue("webcam" in response.json[1])
            self.assertTrue("status" in response.json[1])
            self.assertTrue("job" in response.json[1])

class DetailRoute(unittest.TestCase):
    def test_detail(self):
        with app.test_client() as c:
            response = c.get('/printers/172.16.236.11:8080')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" not in response.json)

    @mock.patch('server.models.octoprint.get_uri', return_value=None)
    def test_fields(self, mock_get_uri):
        with app.test_client() as c:
            response = c.get('/printers/172.16.236.11:8080?fields=webcam,status,job')
            self.assertEqual(response.status_code, 200)
            self.assertTrue("client" in response.json)
            self.assertTrue("webcam" in response.json)
            self.assertTrue("status" in response.json)
            self.assertTrue("job" in response.json)

    def test_404(self):
        with app.test_client() as c:
            response = c.get('/printers/172.16.236.35')
            self.assertEqual(response.status_code, 404)

class CreateRoute(unittest.TestCase):
    @mock.patch('server.services.network.get_avahi_hostname', return_value=None)
    @mock.patch('server.models.octoprint.get_uri', return_value=None)
    def test_create(self, mock_get_uri, mock_avahi):
        try:
            with app.test_client() as c:
                response = c.post('/printers', json={
                    "ip": "172.16.236.200:81",
                    "name": "random-test-printer-name",
                })
                self.assertEqual(response.status_code, 201)
                response = c.get('/printers/172.16.236.200:81')
                self.assertEqual(response.json["ip"], "172.16.236.200:81")
                self.assertEqual(response.json["name"], "random-test-printer-name")
                self.assertEqual(response.json["client"]["name"], "octoprint")
        except Exception as e:
            raise e
        finally:
            c.delete('/printers/172.16.236.200:81')

    def test_empty_req(self):
        with app.test_client() as c:
            response = c.post('/printers')
            self.assertEqual(response.status_code, 400)

    def test_missing_name(self):
        with app.test_client() as c:
            response = c.post('/printers', json={
                "ip": "172.16.236.200",
            })
            self.assertEqual(response.status_code, 400)

    def test_missing_ip(self):
        with app.test_client() as c:
            response = c.post('/printers', json={
                "name": "172.16.236.200",
            })
            self.assertEqual(response.status_code, 400)

    def test_bad_ip(self):
        with app.test_client() as c:
            response = c.post('/printers', json={
                "name": "name...",
                "ip": "bad-ip-address",
            })
            self.assertEqual(response.status_code, 400)

    def test_conflict(self):
        with app.test_client() as c:
            response = c.post('/printers', json={
                "name": "existing-printer",
                "ip": "172.16.236.11:8080",
            })
            self.assertEqual(response.status_code, 409)

class DeleteRoute(unittest.TestCase):
    @mock.patch('server.services.network.get_avahi_hostname', return_value=None)
    @mock.patch('server.models.octoprint.get_uri', return_value=None)
    def test_delete(self, mock_get_uri, mock_avahi):
        with app.test_client() as c:
            response = c.post('/printers', json={
                "ip": "172.16.236.200:81",
                "name": "random-test-printer-name",
            })
            self.assertEqual(response.status_code, 201)
            response = c.delete('/printers/172.16.236.200:81')
            self.assertEqual(response.status_code, 204)

    def test_delete_unknown(self):
        with app.test_client() as c:
            response = c.delete('/printers/172.16.236.213')
            self.assertEqual(response.status_code, 404)
