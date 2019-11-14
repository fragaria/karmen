import unittest

from server import app
from server.database import settings
from server.routes.settings import CONFIGURABLE_SETTINGS
from ..utils import TOKEN_ADMIN, TOKEN_USER


class SettingsRoute(unittest.TestCase):
    def test_get_no_token(self):
        with app.test_client() as c:
            response = c.get("/settings")
            self.assertEqual(response.status_code, 401)

    def test_get(self):
        with app.test_client() as c:
            response = c.get(
                "/settings", headers={"Authorization": "Bearer %s" % (TOKEN_USER,)}
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(response.json), len(CONFIGURABLE_SETTINGS))

    def test_set_bad_data(self):
        with app.test_client() as c:
            response = c.post(
                "/settings",
                json=[{"some": "thing"}],
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(response.status_code, 400)
            response = c.post(
                "/settings",
                json=[{"key": "random"}],
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(response.status_code, 400)
            response = c.post(
                "/settings",
                json=[{"val": "something"}],
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(response.status_code, 400)
            response = c.post(
                "/settings",
                json=[{"key": "random", "val": "something"}],
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(response.status_code, 400)

    def test_set_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/settings", json=[{"key": "network_interface", "val": False}]
            )
            self.assertEqual(response.status_code, 401)

    def test_set_no_data(self):
        with app.test_client() as c:
            response = c.post(
                "/settings", headers={"Authorization": "Bearer %s" % TOKEN_ADMIN}
            )
            self.assertEqual(response.status_code, 400)

    def test_set_data(self):
        with app.test_client() as c:
            orig = settings.get_val("network_interface")
            response = c.post(
                "/settings",
                json=[{"key": "network_interface", "val": not orig}],
                headers={"Authorization": "Bearer %s" % TOKEN_ADMIN},
            )
            self.assertEqual(settings.get_val("network_interface"), not orig)
            self.assertEqual(response.status_code, 201)
            settings.upsert_val("network_interface", orig)

    def test_set_user_token(self):
        with app.test_client() as c:
            response = c.post(
                "/settings",
                json=[{"key": "network_interface", "val": False}],
                headers={"Authorization": "Bearer %s" % (TOKEN_USER,)},
            )
            self.assertEqual(response.status_code, 401)
