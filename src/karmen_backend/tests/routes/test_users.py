import base64
import json
import unittest
import mock

from server import app
from server.database import printers


def get_token_data(jwtoken):
    information = jwtoken.split(".")[1]
    information += "=" * (-len(information) % 4)
    return json.loads(base64.b64decode(information, "-_"))


class AuthenticateRoute(unittest.TestCase):
    def test_no_data(self):
        with app.test_client() as c:
            response = c.post("/users/authenticate")
            self.assertEqual(response.status_code, 400)

    def test_missing_username(self):
        with app.test_client() as c:
            response = c.post("/users/authenticate", json={"password": "random"})
            self.assertEqual(response.status_code, 400)

    def test_missing_password(self):
        with app.test_client() as c:
            response = c.post("/users/authenticate", json={"username": "random"})
            self.assertEqual(response.status_code, 400)

    def test_unknown_user(self):
        with app.test_client() as c:
            response = c.post(
                "/users/authenticate", json={"username": "random", "password": "random"}
            )
            self.assertEqual(response.status_code, 401)

    def test_bad_password(self):
        with app.test_client() as c:
            response = c.post(
                "/users/authenticate",
                json={"username": "test-admin", "password": "random"},
            )
            self.assertEqual(response.status_code, 401)

    def test_returns_fresh_access_token(self):
        with app.test_client() as c:
            response = c.post(
                "/users/authenticate",
                json={"username": "test-admin", "password": "admin-password"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("access_token" in response.json)
            data = get_token_data(response.json["access_token"])
            self.assertEqual(data["fresh"], True)
            self.assertEqual(data["type"], "access")
            self.assertEqual(data["identity"], "6480fa7d-ce18-4ae2-818b-f1d200050806")
            self.assertTrue("user_claims" in data)
            self.assertTrue("role" in data["user_claims"])
            self.assertTrue("force_pwd_change" in data["user_claims"])

    def test_returns_refresh_token(self):
        with app.test_client() as c:
            response = c.post(
                "/users/authenticate",
                json={"username": "test-admin", "password": "admin-password"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("refresh_token" in response.json)
            data = get_token_data(response.json["refresh_token"])
            self.assertEqual(data["type"], "refresh")
            self.assertTrue("fresh" not in data)
            self.assertEqual(data["identity"], "6480fa7d-ce18-4ae2-818b-f1d200050806")
