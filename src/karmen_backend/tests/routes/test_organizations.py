import uuid as guid
import unittest
import random
import string

from server import app
from server.database import organization_roles
from ..utils import (
    TOKEN_USER,
    TOKEN_USER_CSRF,
    TOKEN_USER2,
    TOKEN_USER2_CSRF,
    UUID_USER,
    UUID_USER2,
)


def get_random_name():
    alphabet = string.ascii_lowercase
    return "org %s" % "".join(random.sample(alphabet, 10))


class CreateOrganizationRoute(unittest.TestCase):
    def test_fail_no_token(self):
        with app.test_client() as c:
            response = c.post("/organizations")
            self.assertEqual(response.status_code, 401)

    def test_fail_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations", headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_no_org_name(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"some": "data"},
            )
            self.assertEqual(response.status_code, 400)

    def test_create_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            name = get_random_name()
            response = c.post(
                "/organizations",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": " %s" % name.upper()},
            )
            self.assertEqual(response.status_code, 201)
            self.assertTrue("uuid" in response.json)
            self.assertEqual(response.json["name"], name.upper())
            response = c.get("/organizations/%s/users" % response.json["uuid"])
            self.assertTrue("items" in response.json)
            self.assertEqual(response.json["items"][0]["uuid"], UUID_USER)
            self.assertEqual(response.json["items"][0]["role"], "admin")


class PatchOrganizationRoute(unittest.TestCase):
    def setUp(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": get_random_name()},
            )
            self.uuid = response.json["uuid"]

    def test_fail_no_token(self):
        with app.test_client() as c:
            response = c.patch("/organizations/%s" % self.uuid)
            self.assertEqual(response.status_code, 401)

    def test_fail_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/%s" % self.uuid,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_not_org_admin(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.patch(
                "/organizations/%s" % guid.uuid4(),
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
                json={"name": "something"},
            )
            self.assertEqual(response.status_code, 403)

    def test_fail_no_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/%s" % guid.uuid4(),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": "something"},
            )
            self.assertEqual(response.status_code, 403)

    def test_fail_no_org_name(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.patch(
                "/organizations/%s" % self.uuid,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"some": "data"},
            )
            self.assertEqual(response.status_code, 400)

    def test_patch_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            name = get_random_name()
            response = c.patch(
                "/organizations/%s" % self.uuid,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": " %s" % name},
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json["uuid"], self.uuid)
            self.assertEqual(response.json["name"], " %s" % name)

    def test_org_same_name(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            name = get_random_name()
            response = c.post(
                "/organizations",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": name},
            )
            self.assertEqual(response.status_code, 201)
            response = c.patch(
                "/organizations/%s" % response.json["uuid"],
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": name},
            )
            self.assertEqual(response.status_code, 200)


class ListOrganizationsRoute(unittest.TestCase):
    def setUp(self):
        with app.test_client() as c:
            self.uuids1 = []
            self.uuids2 = []
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            for i in range(0, 2):
                response = c.post(
                    "/organizations",
                    headers={"x-csrf-token": TOKEN_USER_CSRF},
                    json={"name": get_random_name()},
                )
                self.uuids1.append(response.json["uuid"])
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.post(
                "/organizations",
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
                json={"name": get_random_name()},
            )
            self.uuids2.append(response.json["uuid"])

    def test_fail_no_token(self):
        with app.test_client() as c:
            response = c.get("/organizations")
            self.assertEqual(response.status_code, 401)

    def test_list(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.get(
                "/organizations", headers={"x-csrf-token": TOKEN_USER2_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(
                len(response.json["items"])
                <= len(organization_roles.get_by_user_uuid(UUID_USER2))
            )

            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.get(
                "/organizations", headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            self.assertTrue(
                len(response.json["items"])
                <= len(organization_roles.get_by_user_uuid(UUID_USER))
            )
