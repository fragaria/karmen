import random
import math
import string
import unittest
import bcrypt

from server import app
from server.database import users, local_users
from ..utils import (
    TOKEN_ADMIN_EXPIRED,
    TOKEN_ADMIN_EXPIRED_CSRF,
    TOKEN_ADMIN,
    TOKEN_ADMIN_CSRF,
    TOKEN_ADMIN_NONFRESH,
    TOKEN_ADMIN_NONFRESH_CSRF,
    TOKEN_USER,
    TOKEN_USER_CSRF,
    UUID_ADMIN,
    UUID_USER,
)


def get_random_username():
    alphabet = string.ascii_lowercase
    return "user-%s" % "".join(random.sample(alphabet, 10))


class CreateUserRoute(unittest.TestCase):
    def test_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/users",
                json={
                    "username": get_random_username(),
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_expired_jwt(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_EXPIRED)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_EXPIRED_CSRF},
                json={
                    "username": get_random_username(),
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_no_admin_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "username": get_random_username(),
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_nonfresh_admin_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_NONFRESH)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_NONFRESH_CSRF},
                json={
                    "username": get_random_username(),
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post("/users", headers={"x-csrf-token": TOKEN_ADMIN_CSRF})
            self.assertEqual(response.status_code, 400)

    def test_no_username(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_no_role(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": "username",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_unknown_role(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": get_random_username(),
                    "system_role": "doesnotexist",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_password_mismatch(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": get_random_username(),
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one-mismatch",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_create_user(self):
        with app.test_client() as c:
            username = get_random_username()
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": username,
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 201)
            self.assertTrue("uuid" in response.json)
            self.assertTrue("username" in response.json)
            self.assertTrue("system_role" in response.json)
            self.assertTrue("suspended" in response.json)
            user = users.get_by_username(username)
            self.assertTrue(user is not None)
            self.assertEqual(user["username"], username)
            self.assertEqual(user["system_role"], "user")
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
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            username = get_random_username()
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": username,
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 201)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": username,
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 409)


class UpdateUserRoute(unittest.TestCase):
    def setUp(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/users",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": get_random_username(),
                    "system_role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.uuid = response.json["uuid"]

    def test_no_token(self):
        with app.test_client() as c:
            response = c.patch("/users/%s" % self.uuid, json={"system_role": "user"})
            self.assertEqual(response.status_code, 401)

    def test_no_admin_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/users/%s" % self.uuid,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"system_role": "user"},
            )
            self.assertEqual(response.status_code, 401)

    def test_no_fresh_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_NONFRESH)
            response = c.patch(
                "/users/%s" % self.uuid,
                headers={"x-csrf-token": TOKEN_ADMIN_NONFRESH_CSRF},
                json={"system_role": "user"},
            )
            self.assertEqual(response.status_code, 401)

    def test_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/users/%s" % self.uuid, headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_role(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/users/%s" % self.uuid,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"suspended": True},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("system_role" in response.json)
            self.assertTrue("suspended" in response.json)
            self.assertEqual(response.json["system_role"], "user")
            self.assertEqual(response.json["suspended"], True)
            user = users.get_by_uuid(self.uuid)
            self.assertTrue(user is not None)
            self.assertEqual(user["system_role"], "user")
            self.assertEqual(user["suspended"], True)

    def test_no_suspended(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/users/%s" % self.uuid,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"system_role": "admin"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("system_role" in response.json)
            self.assertTrue("suspended" in response.json)
            self.assertEqual(response.json["system_role"], "admin")
            self.assertEqual(response.json["suspended"], False)
            user = users.get_by_uuid(self.uuid)
            self.assertTrue(user is not None)
            self.assertEqual(user["system_role"], "admin")
            self.assertEqual(user["suspended"], False)

    def test_unknown_role(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/users/%s" % self.uuid,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"system_role": "doesnotexist"},
            )
            self.assertEqual(response.status_code, 400)

    def test_update_user(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/users/%s" % self.uuid,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"system_role": "admin", "suspended": True},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("system_role" in response.json)
            self.assertTrue("suspended" in response.json)
            self.assertEqual(response.json["system_role"], "admin")
            self.assertEqual(response.json["suspended"], True)
            user = users.get_by_uuid(self.uuid)
            self.assertTrue(user is not None)
            self.assertEqual(user["system_role"], "admin")
            self.assertEqual(user["suspended"], True)

    def test_self_lockout(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/users/%s" % UUID_ADMIN,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"system_role": "admin", "suspended": True},
            )
            self.assertEqual(response.status_code, 409)

    def test_nonexisting_user(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/users/6480fa7d-ce18-4ae2-1234-f1d200050806",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"system_role": "user", "suspended": False},
            )
            self.assertEqual(response.status_code, 404)


class ListRoute(unittest.TestCase):
    def test_no_token(self):
        with app.test_client() as c:
            response = c.get("/users")
            self.assertEqual(response.status_code, 401)

    def test_no_admin_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get("/users", headers={"x-csrf-token": TOKEN_USER_CSRF})
            self.assertEqual(response.status_code, 401)

    def test_nonfresh_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_NONFRESH)
            response = c.get(
                "/users", headers={"x-csrf-token": TOKEN_ADMIN_NONFRESH_CSRF}
            )
            self.assertEqual(response.status_code, 401)

    def test_list(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get("/users", headers={"x-csrf-token": TOKEN_ADMIN_CSRF})
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            if len(response.json["items"]) < 200:
                self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            self.assertTrue("uuid" in response.json["items"][0])
            self.assertTrue("username" in response.json["items"][0])
            self.assertTrue("system_role" in response.json["items"][0])
            self.assertTrue("suspended" in response.json["items"][0])

    def test_order_by(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?order_by=username", headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            prev = None
            for code in response.json["items"]:
                if prev:
                    self.assertTrue(code["username"] >= prev["username"])
                    # we are ordering implicitly by id ASC as well
                    if code["username"] == prev["username"]:
                        self.assertTrue(code["uuid"] >= prev["uuid"])
                prev = code

    def test_order_by_with_plus(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?order_by=%2Busername&limit=2",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(
                response.json.get("next"),
                "/users?limit=2&order_by=+username&start_with=77315957-8ebb-4a44-976c-758dbf28bb9f",
            )

    def test_limit(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?limit=1&order_by=username",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 1)
            self.assertTrue("/users?limit=1&order_by=username" in response.json["next"])

    def test_no_multi_order_by(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?limit=3&order_by=uuid,username",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_start_with(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?limit=2&start_with=%s&order_by=-uuid" % UUID_USER,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 2)
            self.assertTrue(response.json["items"][0]["uuid"] == UUID_USER)
            self.assertTrue(
                response.json["items"][1]["uuid"] < response.json["items"][0]["uuid"]
            )
            self.assertTrue(
                "/users?limit=2&order_by=-uuid&start_with" in response.json["next"]
            )

    def test_start_with_non_existent(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?limit=1&start_with=00005957-8ebb-4a44-1234-758dbf28bb9f&order_by=-username",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_ignore_start_with_str(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?limit=3&start_with=asdfasdf",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_ignore_negative_limit(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?limit=-3", headers={"x-csrf-token": TOKEN_ADMIN_CSRF}
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_start_with_negative(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?limit=3&start_with=-1",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_limit_str(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?limit=asdfasdf&start_with=5",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_filter_absent(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?filter=username:unknown-username",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_filter(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?filter=username:admin&order_by=uuid",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            for user in response.json["items"]:
                self.assertTrue(user["username"], "admin-test")

    def test_filter_next(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?filter=username:user&limit=1&order_by=-uuid",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 1)
            response2 = c.get(
                response.json["next"], headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertTrue("items" in response2.json)
            self.assertTrue(
                response.json["items"][0]["uuid"] > response2.json["items"][0]["uuid"]
            )

    def test_filter_ignore_bad_column(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?filter=random:file1",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)

    def test_filter_ignore_bad_format(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/users?filter=file1", headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)
