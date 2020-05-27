import random
import mock
import string
import unittest
from datetime import datetime
import uuid as guid
import json
from server import app
from server.database import users, local_users, organization_roles, api_tokens
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
    UUID_USER2,
    UUID_ORG,
    UUID_ORG2,
    LOCAL_TESTS_TOKEN,
    UUID_INVALID,
)


def get_random_username():
    alphabet = string.ascii_lowercase
    return "user-%s" % "".join(random.sample(alphabet, 10))


def get_random_email():
    alphabet = string.ascii_lowercase
    return "user-%s@ktest.local" % "".join(random.sample(alphabet, 10))


def create_new_org():
    with app.test_client() as c:
        response = c.post(
            f"/tests-admin/organizations/",
            json={
                "name": get_random_username(),
                "local-tests-token": LOCAL_TESTS_TOKEN,
            },
        )
        resp = json.loads(response.data)
        return resp["uuid"]


class CreateUsersViaLocalTestsAdmin(unittest.TestCase):
    def test_create_user(self):
        email = get_random_email()
        password = get_random_username()
        with app.test_client() as c:
            response = c.post(
                "/tests-admin/users/create",
                json={
                    "email": email,
                    "password": password,
                    "local-tests-token": LOCAL_TESTS_TOKEN,
                },
            )
            resp = json.loads(response.data)
            self.assertEqual(response.status_code, 201)
            self.assertTrue(resp["activated"])
            self.assertTrue("user_uuid" in resp.keys())

    def test_fail_without_token(self):
        email = get_random_email()
        password = get_random_username()
        with app.test_client() as c:
            response = c.post(
                "/tests-admin/users/create",
                json={"email": email, "password": password,},
            )
            self.assertEqual(response.status_code, 403)

    def test_fail_without_set_token(self):
        app.config["LOCAL_TESTS_TOKEN"] = ""
        email = get_random_email()
        password = get_random_username()
        with app.test_client() as c:
            response = c.post(
                "/tests-admin/users/create",
                json={"email": email, "password": password, "local-tests-token": ""},
            )
            self.assertEqual(response.status_code, 403)
        app.config["LOCAL_TESTS_TOKEN"] = LOCAL_TESTS_TOKEN


class CreateOrganizationViaTestsAdmin(unittest.TestCase):
    def create_org(self):
        with app.test_client() as c:
            response = c.post(
                f"/tests-admin/organizations/",
                json={"name": "Testovačka", "local-tests-token": LOCAL_TESTS_TOKEN},
            )
            self.assertEqual(response.status_code, 200)


class AddUsersToOrgViaTestsAdmin(unittest.TestCase):
    def test_add_user_to_org(self):
        with app.test_client() as c:
            response = c.post(
                f"/tests-admin/organizations/{create_new_org()}/users",
                json={
                    "uuid": UUID_USER2,
                    "role": "user",
                    "local-tests-token": LOCAL_TESTS_TOKEN,
                },
            )
            self.assertEqual(response.status_code, 200)

    def test_adding_twice_fails(self):
        org = create_new_org()
        with app.test_client() as c:
            response = c.post(
                f"/tests-admin/organizations/{org}/users",
                json={
                    "uuid": UUID_USER2,
                    "role": "user",
                    "local-tests-token": LOCAL_TESTS_TOKEN,
                },
            )
            self.assertEqual(response.status_code, 200)
            response = c.post(
                f"/tests-admin/organizations/{org}/users",
                json={
                    "uuid": UUID_USER2,
                    "role": "user",
                    "local-tests-token": LOCAL_TESTS_TOKEN,
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_invalid_org_fails(self):
        with app.test_client() as c:
            response = c.post(
                f"/tests-admin/organizations/{UUID_INVALID}/users",
                json={
                    "uuid": UUID_USER2,
                    "role": "user",
                    "local-tests-token": LOCAL_TESTS_TOKEN,
                },
            )
            self.assertEqual(response.status_code, 400)
