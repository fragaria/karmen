import bcrypt
import random
import string
import unittest
import mock

from server import app
from server.database import users, local_users


def get_random_username():
    alphabet = string.ascii_lowercase
    return "user-%s" % "".join(random.sample(alphabet, 10))


class CreateUserRoute(unittest.TestCase):
    def setUp(self):
        with app.test_client() as c:
            response = c.post(
                "/users/authenticate",
                json={"username": "test-admin", "password": "admin-password"},
            )
            self.admin_jwt = response.json["access_token"]
            response = c.post(
                "/users/authenticate",
                json={"username": "test-user", "password": "user-password"},
            )
            self.user_jwt = response.json["access_token"]

    def test_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/admin/users",
                json={
                    "username": get_random_username(),
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_no_admin_token(self):
        with app.test_client() as c:
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.user_jwt,)},
                json={
                    "username": get_random_username(),
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_no_data(self):
        with app.test_client() as c:
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_username(self):
        with app.test_client() as c:
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_no_role(self):
        with app.test_client() as c:
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={
                    "username": "username",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_unknown_role(self):
        with app.test_client() as c:
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={
                    "username": get_random_username(),
                    "role": "doesnotexist",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_password_mismatch(self):
        with app.test_client() as c:
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={
                    "username": get_random_username(),
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one-mismatch",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_create_user(self):
        with app.test_client() as c:
            username = get_random_username()
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={
                    "username": username,
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 201)
            user = users.get_by_username(username)
            self.assertTrue(user is not None)
            self.assertEqual(user["username"], username)
            self.assertEqual(user["role"], "user")
            luser = local_users.get_local_user(user["uuid"])
            self.assertTrue(luser is not None)
            self.assertEqual(luser["force_pwd_change"], True)
            self.assertTrue(
                bcrypt.checkpw(
                    "temp-one".encode("utf8"), luser["pwd_hash"].encode("utf8")
                )
            )

    def test_conflict_usernames(self):
        with app.test_client() as c:
            username = get_random_username()
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={
                    "username": username,
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 201)
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={
                    "username": username,
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 409)
