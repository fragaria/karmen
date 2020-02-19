import random
import math
import string
import unittest
import bcrypt
import uuid as uuidmodule
from server import app
from server.database import users, local_users, organizations, api_tokens
from ..utils import (
    TOKEN_ADMIN_EXPIRED,
    TOKEN_ADMIN_EXPIRED_CSRF,
    TOKEN_ADMIN,
    TOKEN_ADMIN_CSRF,
    TOKEN_ADMIN_NONFRESH,
    TOKEN_ADMIN_NONFRESH_CSRF,
    TOKEN_USER,
    TOKEN_USER_CSRF,
    TOKEN_USER2,
    TOKEN_USER2_CSRF,
    UUID_ADMIN,
    UUID_USER,
    UUID_USER2,
    UUID_ORG,
    UUID_ORG2,
)


def get_random_username():
    alphabet = string.ascii_lowercase
    return "user-%s" % "".join(random.sample(alphabet, 10))


class CreateUserRoute(unittest.TestCase):
    def test_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                json={
                    "username": get_random_username(),
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_expired_jwt(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_EXPIRED)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_EXPIRED_CSRF},
                json={
                    "username": get_random_username(),
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_bad_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_EXPIRED)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_ADMIN_EXPIRED_CSRF},
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
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "username": get_random_username(),
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 403)

    def test_nonfresh_admin_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_NONFRESH)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_NONFRESH_CSRF},
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
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_username(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_no_role(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
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
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
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
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
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
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
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
            orgrole = organizations.get_organization_role(UUID_ORG, user["uuid"])
            self.assertTrue(orgrole["role"], "user")

    def test_conflict_usernames_same_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            username = get_random_username()
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": username,
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 201)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": username,
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 409)

    def test_conflict_system_usernames(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            username = get_random_username()
            response = c.post(
                "/organizations/%s/users" % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={
                    "username": username,
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 201)
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": username,
                    "role": "user",
                    "password": "temp-onexx",
                    "password_confirmation": "temp-onexx",
                },
            )
            user = users.get_by_username(username)
            luser = local_users.get_local_user(user["uuid"])
            self.assertEqual(response.status_code, 201)
            self.assertTrue(
                bcrypt.checkpw(
                    "temp-one".encode("utf8"), luser["pwd_hash"].encode("utf8")
                )
            )


class UpdateUserRoute(unittest.TestCase):
    def setUp(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
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
            response = c.patch(
                "/organizations/%s/users/%s" % (UUID_ORG, self.uuid),
                json={"role": "user"},
            )
            self.assertEqual(response.status_code, 401)

    def test_no_admin_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/%s/users/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"role": "user"},
            )
            self.assertEqual(response.status_code, 403)

    def test_no_fresh_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_NONFRESH)
            response = c.patch(
                "/organizations/%s/users/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_NONFRESH_CSRF},
                json={"role": "user"},
            )
            self.assertEqual(response.status_code, 401)

    def test_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/users/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_role(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/users/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={},
            )
            self.assertEqual(response.status_code, 400)

    def test_unknown_role(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/users/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "doesnotexist"},
            )
            self.assertEqual(response.status_code, 400)

    def test_update_user(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/users/%s" % (UUID_ORG, self.uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "admin"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("role" in response.json)
            self.assertEqual(response.json["role"], "admin")
            user = organizations.get_organization_role(UUID_ORG, self.uuid)
            self.assertTrue(user is not None)
            self.assertEqual(user["role"], "admin")

    def test_self_lockout(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/users/%s" % (UUID_ORG, UUID_ADMIN),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user",},
            )
            self.assertEqual(response.status_code, 409)

    def test_nonexisting_user(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "/organizations/%s/users/6480fa7d-ce18-4ae2-1234-f1d200050806"
                % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user"},
            )
            self.assertEqual(response.status_code, 404)


class ListRoute(unittest.TestCase):
    def test_no_token(self):
        with app.test_client() as c:
            response = c.get("/organizations/%s/users" % UUID_ORG)
            self.assertEqual(response.status_code, 401)

    def test_no_admin_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 403)

    def test_nonfresh_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_NONFRESH)
            response = c.get(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_NONFRESH_CSRF},
            )
            self.assertEqual(response.status_code, 401)

    def test_list(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.get(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue("next" not in response.json)
            self.assertTrue(len(response.json["items"]) >= 2)
            self.assertTrue("uuid" in response.json["items"][0])
            self.assertTrue("username" in response.json["items"][0])
            self.assertTrue("role" in response.json["items"][0])
            for u in response.json["items"]:
                self.assertTrue(u["uuid"] != UUID_USER2)


class DeleteUser(unittest.TestCase):
    def test_delete(self):
        with app.test_client() as c:
            username = get_random_username()
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "username": username,
                    "role": "user",
                    "password": "temp-one",
                    "password_confirmation": "temp-one",
                },
            )
            self.assertEqual(response.status_code, 201)
            uuid = response.json["uuid"]
            user = users.get_by_username(username)
            api_tokens.add_token(
                user_uuid=uuid,
                jti=uuidmodule.uuid4(),
                organization_uuid=UUID_ORG,
                name="jti",
            )
            self.assertTrue(user["uuid"], uuid)
            response = c.delete(
                "/organizations/%s/users/%s" % (UUID_ORG, uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 204)
            orgrole = organizations.get_organization_role(UUID_ORG, user["uuid"])
            tokens = api_tokens.get_tokens_for_user_uuid(
                user["uuid"], org_uuid=UUID_ORG
            )
            self.assertTrue(user is not None)
            self.assertTrue(orgrole is None)
            for t in tokens:
                self.assertTrue(t["revoked"])
                self.assertTrue(t["organization_uuid"] == UUID_ORG)
