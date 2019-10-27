import unittest

from server import app
from server.database import settings
from server.routes.settings import CONFIGURABLE_SETTINGS


class SettingsRoute(unittest.TestCase):
    def test_get(self):
        with app.test_client() as c:
            response = c.get("/settings")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(response.json), len(CONFIGURABLE_SETTINGS))

    def test_set_bad_data(self):
        with app.test_client() as c:
            response = c.post("/settings", json=[{"some": "thing"}])
            self.assertEqual(response.status_code, 400)
            response = c.post("/settings", json=[{"key": "random"}])
            self.assertEqual(response.status_code, 400)
            response = c.post("/settings", json=[{"val": "something"}])
            self.assertEqual(response.status_code, 400)
            response = c.post("/settings", json=[{"key": "random", "val": "something"}])
            self.assertEqual(response.status_code, 400)

    def test_set_no_data(self):
        with app.test_client() as c:
            response = c.post("/settings")
            self.assertEqual(response.status_code, 400)

    def test_set_data(self):
        with app.test_client() as c:
            orig = settings.get_val("network_interface")
            response = c.post(
                "/settings", json=[{"key": "network_interface", "val": not orig}]
            )
            self.assertEqual(settings.get_val("network_interface"), not orig)
            self.assertEqual(response.status_code, 201)
            settings.upsert_val("network_interface", orig)
