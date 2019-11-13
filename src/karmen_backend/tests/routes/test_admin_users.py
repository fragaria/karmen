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
            self.assertTrue("uuid" in response.json)
            self.assertTrue("username" in response.json)
            self.assertTrue("role" in response.json)
            self.assertTrue("disabled" in response.json)
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


class UpdateUserRoute(unittest.TestCase):
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
            response = c.post(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={
                    "username": get_random_username(),
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.uuid = response.json["uuid"]

    def test_no_token(self):
        with app.test_client() as c:
            response = c.patch("/admin/users/%s" % self.uuid, json={"role": "user"})
            self.assertEqual(response.status_code, 401)

    def test_no_admin_token(self):
        with app.test_client() as c:
            response = c.patch(
                "/admin/users/%s" % self.uuid,
                headers={"Authorization": "Bearer %s" % (self.user_jwt,)},
                json={"role": "user"},
            )
            self.assertEqual(response.status_code, 401)

    def test_no_data(self):
        with app.test_client() as c:
            response = c.patch(
                "/admin/users/%s" % self.uuid,
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_role(self):
        with app.test_client() as c:
            response = c.patch(
                "/admin/users/%s" % self.uuid,
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={"disabled": True},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("role" in response.json)
            self.assertTrue("disabled" in response.json)
            self.assertEqual(response.json["role"], "user")
            self.assertEqual(response.json["disabled"], True)
            user = users.get_by_uuid(self.uuid)
            self.assertTrue(user is not None)
            self.assertEqual(user["role"], "user")
            self.assertEqual(user["disabled"], True)

    def test_no_disabled(self):
        with app.test_client() as c:
            response = c.patch(
                "/admin/users/%s" % self.uuid,
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={"role": "admin"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("role" in response.json)
            self.assertTrue("disabled" in response.json)
            self.assertEqual(response.json["role"], "admin")
            self.assertEqual(response.json["disabled"], False)
            user = users.get_by_uuid(self.uuid)
            self.assertTrue(user is not None)
            self.assertEqual(user["role"], "admin")
            self.assertEqual(user["disabled"], False)

    def test_unknown_role(self):
        with app.test_client() as c:
            response = c.patch(
                "/admin/users/%s" % self.uuid,
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={"role": "doesnotexist"},
            )
            self.assertEqual(response.status_code, 400)

    def test_update_user(self):
        with app.test_client() as c:
            response = c.patch(
                "/admin/users/%s" % self.uuid,
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={"role": "admin", "disabled": True},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("role" in response.json)
            self.assertTrue("disabled" in response.json)
            self.assertEqual(response.json["role"], "admin")
            self.assertEqual(response.json["disabled"], True)
            user = users.get_by_uuid(self.uuid)
            self.assertTrue(user is not None)
            self.assertEqual(user["role"], "admin")
            self.assertEqual(user["disabled"], True)

    def test_self_lockout(self):
        with app.test_client() as c:
            response = c.patch(
                "/admin/users/6480fa7d-ce18-4ae2-818b-f1d200050806",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={"role": "admin", "disabled": True},
            )
            self.assertEqual(response.status_code, 409)

    def test_nonexisting_user(self):
        with app.test_client() as c:
            response = c.patch(
                "/admin/users/6480fa7d-ce18-4ae2-1234-f1d200050806",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
                json={"role": "user", "disabled": False},
            )
            self.assertEqual(response.status_code, 404)


class ListRoute(unittest.TestCase):
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
            response = c.get("/admin/users")
            self.assertEqual(response.status_code, 401)

    def test_no_admin_token(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.user_jwt,)},
            )
            self.assertEqual(response.status_code, 401)

    def test_list(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            if len(response.json["items"]) < 200:
                self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            self.assertTrue("uuid" in response.json["items"][0])
            self.assertTrue("username" in response.json["items"][0])
            self.assertTrue("role" in response.json["items"][0])
            self.assertTrue("disabled" in response.json["items"][0])

    def test_order_by(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?order_by=username",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
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

    def test_limit(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?limit=1&order_by=username",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 1)
            self.assertTrue(
                "/admin/users?limit=1&order_by=username" in response.json["next"]
            )

    def test_no_multi_order_by(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?limit=3&order_by=uuid,username",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 400)

    def test_start_with(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?limit=2&start_with=77315957-8ebb-4a44-976c-758dbf28bb9f&order_by=-uuid",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 2)
            self.assertTrue(
                response.json["items"][0]["uuid"]
                == "77315957-8ebb-4a44-976c-758dbf28bb9f"
            )
            self.assertTrue(
                response.json["items"][1]["uuid"] < response.json["items"][0]["uuid"]
            )
            self.assertTrue(
                "/admin/users?limit=2&order_by=-uuid&start_with"
                in response.json["next"]
            )

    def test_start_with_non_existent(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?limit=1&start_with=00315957-8ebb-4a44-1234-758dbf28bb9f&order_by=-username",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_ignore_start_with_str(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?limit=3&start_with=asdfasdf",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_ignore_negative_limit(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?limit=-3",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_start_with_negative(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?limit=3&start_with=-1",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_survive_ignore_limit_str(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?limit=asdfasdf&start_with=5",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)

    def test_filter_absent(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?filter=username:unknown-username",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) == 0)

    def test_filter(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?filter=username:admin&order_by=uuid",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            for user in response.json["items"]:
                self.assertTrue(user["username"], "admin-test")

    def test_filter_next(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?filter=username:user&limit=2&order_by=-uuid",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" in response.json)
            self.assertTrue(len(response.json["items"]) == 2)
            response2 = c.get(
                response.json["next"],
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertTrue("items" in response2.json)
            self.assertTrue(
                response.json["items"][0]["uuid"] > response2.json["items"][0]["uuid"]
            )

    def test_filter_ignore_bad_column(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?filter=random:file1",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)

    def test_filter_ignore_bad_format(self):
        with app.test_client() as c:
            response = c.get(
                "/admin/users?filter=file1",
                headers={"Authorization": "Bearer %s" % (self.admin_jwt,)},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(len(response.json["items"]) >= 1)
