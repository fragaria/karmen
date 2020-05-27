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
)


def get_random_username():
    alphabet = string.ascii_lowercase
    return "user-%s" % "".join(random.sample(alphabet, 10))


def get_random_email():
    alphabet = string.ascii_lowercase
    return "user-%s@ktest.local" % "".join(random.sample(alphabet, 10))


class CreateUserInOrganizationRoute(unittest.TestCase):
    def test_no_token(self):
        with app.test_client() as c:
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                json={"role": "user", "email": get_random_email(),},
            )
            self.assertEqual(response.status_code, 401)

    def test_expired_jwt(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_EXPIRED)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_EXPIRED_CSRF},
                json={"role": "user", "email": get_random_email(),},
            )
            self.assertEqual(response.status_code, 401)

    def test_bad_org(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_EXPIRED)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_ADMIN_EXPIRED_CSRF},
                json={"role": "user", "email": get_random_email(),},
            )
            self.assertEqual(response.status_code, 401)

    def test_no_admin_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"role": "user", "email": get_random_email(),},
            )
            self.assertEqual(response.status_code, 403)

    def test_nonfresh_admin_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_NONFRESH)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_NONFRESH_CSRF},
                json={"role": "user", "email": get_random_email(),},
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

    def test_no_role(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"email": get_random_email()},
            )
            self.assertEqual(response.status_code, 400)

    def test_no_email(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user"},
            )
            self.assertEqual(response.status_code, 400)

    def test_unknown_role(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "doesnotexist", "email": get_random_email(),},
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_email(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user", "email": "not an email"},
            )
            self.assertEqual(response.status_code, 400)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_create_user(self, mock_send_mail):
        with app.test_client() as c:
            email = get_random_email()
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user", "email": "    %s    " % email.upper()},
            )
            self.assertEqual(response.status_code, 201)
            self.assertTrue("uuid" in response.json)
            self.assertTrue("username" in response.json)
            self.assertTrue("role" in response.json)
            self.assertTrue("email" in response.json)
            user = users.get_by_email(email)
            self.assertTrue(user is not None)
            self.assertEqual(user["username"], email)
            self.assertEqual(user["email"], email)
            self.assertEqual(user["system_role"], "user")
            luser = local_users.get_local_user(user["uuid"])
            self.assertTrue(luser is None)
            args = mock_send_mail.call_args_list
            self.assertEqual(args[0][0][0][0], email)
            self.assertEqual(args[0][0][1], "REGISTRATION_VERIFICATION_EMAIL")
            self.assertTrue(args[0][0][2]["activation_key"] is not None)
            self.assertTrue(args[0][0][2]["activation_key_expires"] is not None)
            self.assertTrue(args[0][0][2]["organization_name"] is not None)
            self.assertTrue(args[0][0][2]["organization_uuid"] is not None)
            self.assertEqual(args[0][0][2]["email"], email)
            orgrole = organization_roles.get_organization_role(UUID_ORG, user["uuid"])
            self.assertTrue(orgrole["role"], "user")

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_conflict_usernames_same_org(self, mock_send_mail):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            username = get_random_username()
            email = get_random_email()
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"username": username, "role": "user", "email": email},
            )
            self.assertEqual(response.status_code, 201)
            user = users.get_by_email(email)
            self.assertEqual(mock_send_mail.call_count, 1)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"username": username, "role": "user", "email": email},
            )
            self.assertEqual(response.status_code, 201)
            user2 = users.get_by_email(email)
            self.assertTrue(user["activation_key_hash"] != user2["activation_key_hash"])
            self.assertEqual(mock_send_mail.call_count, 2)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_concurrent_orgs_inactive_user(self, mock_send_mail):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            username = get_random_username()
            email = get_random_email()
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"username": username, "role": "user", "email": email},
            )
            self.assertEqual(response.status_code, 201)
            user = users.get_by_email(email)
            args = mock_send_mail.call_args_list
            self.assertEqual(args[0][0][0][0], email)
            self.assertEqual(args[0][0][1], "REGISTRATION_VERIFICATION_EMAIL")
            self.assertTrue(args[0][0][2]["activation_key"] is not None)
            self.assertTrue(args[0][0][2]["activation_key_expires"] is not None)
            self.assertTrue(args[0][0][2]["organization_name"] is not None)
            self.assertTrue(args[0][0][2]["organization_uuid"] == UUID_ORG)
            self.assertEqual(args[0][0][2]["email"], email)
            orgrole = organization_roles.get_organization_role(UUID_ORG, user["uuid"])
            self.assertTrue(orgrole["role"], "user")
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"username": username, "role": "user", "email": email},
            )
            self.assertEqual(response.status_code, 201)
            args = mock_send_mail.call_args_list
            self.assertEqual(args[1][0][1], "REGISTRATION_VERIFICATION_EMAIL")
            self.assertTrue(args[1][0][2]["activation_key"] is not None)
            self.assertTrue(args[1][0][2]["activation_key_expires"] is not None)
            self.assertTrue(args[1][0][2]["organization_name"] is not None)
            self.assertTrue(args[1][0][2]["organization_uuid"] == UUID_ORG2)
            self.assertEqual(args[1][0][2]["email"], email)
            orgrole = organization_roles.get_organization_role(UUID_ORG2, user["uuid"])
            self.assertTrue(orgrole["role"], "user")

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_existing_user_different_org(self, mock_send_mail):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            username = get_random_username()
            email = get_random_email()
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"username": username, "role": "user", "email": email},
            )
            self.assertEqual(response.status_code, 201)
            user = users.get_by_email(email)
            args = mock_send_mail.call_args_list
            self.assertEqual(args[0][0][0][0], email)
            self.assertEqual(args[0][0][1], "REGISTRATION_VERIFICATION_EMAIL")
            self.assertTrue(args[0][0][2]["activation_key"] is not None)
            self.assertTrue(args[0][0][2]["activation_key_expires"] is not None)
            self.assertTrue(args[0][0][2]["organization_name"] is not None)
            self.assertTrue(args[0][0][2]["organization_uuid"] == UUID_ORG)
            self.assertEqual(args[0][0][2]["email"], email)
            orgrole = organization_roles.get_organization_role(UUID_ORG, user["uuid"])
            self.assertTrue(orgrole["role"], "user")
            # fake activate
            users.update_user(uuid=user["uuid"], activated=datetime.now())
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG2,
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"username": username, "role": "user", "email": email},
            )
            self.assertEqual(response.status_code, 201)
            args = mock_send_mail.call_args_list
            self.assertEqual(args[1][0][0][0], email)
            self.assertEqual(args[1][0][1], "ORGANIZATION_INVITATION")
            self.assertTrue("activation_key" not in args[1][0][2])
            self.assertTrue("activation_key_expires" not in args[1][0][2])
            self.assertTrue(args[1][0][2]["organization_name"] is not None)
            self.assertTrue(args[1][0][2]["organization_uuid"] == UUID_ORG2)
            self.assertEqual(args[1][0][2]["email"], email)
            orgrole = organization_roles.get_organization_role(UUID_ORG2, user["uuid"])
            self.assertTrue(orgrole["role"], "user")


class UpdateUserRoute(unittest.TestCase):
    def setUp(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user", "email": get_random_email(),},
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
            user = organization_roles.get_organization_role(UUID_ORG, self.uuid)
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
            self.assertTrue("activated" in response.json["items"][0])
            self.assertTrue("email" in response.json["items"][0])
            self.assertTrue("role" in response.json["items"][0])
            for u in response.json["items"]:
                self.assertTrue(u["uuid"] != UUID_USER2)


class DeleteUser(unittest.TestCase):
    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_delete(self, mock_send_mail):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            email = get_random_email()
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user", "email": email,},
            )
            self.assertEqual(response.status_code, 201)
            uuid = response.json["uuid"]
            user = users.get_by_email(email)
            api_tokens.add_token(
                user_uuid=uuid,
                jti=guid.uuid4(),
                organization_uuid=UUID_ORG,
                name="jti",
            )
            self.assertTrue(user["uuid"], uuid)
            response = c.delete(
                "/organizations/%s/users/%s" % (UUID_ORG, uuid),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 204)
            orgrole = organization_roles.get_organization_role(UUID_ORG, user["uuid"])
            tokens = api_tokens.get_tokens_for_user_uuid(
                user["uuid"], org_uuid=UUID_ORG
            )
            self.assertTrue(user is not None)
            self.assertTrue(orgrole is None)
            for t in tokens:
                self.assertTrue(t["revoked"])
                self.assertTrue(t["organization_uuid"] == UUID_ORG)
            args = mock_send_mail.call_args_list
            self.assertEqual(args[1][0][0][0], email)
            self.assertEqual(args[1][0][1], "ORGANIZATION_REMOVAL")
            self.assertTrue(args[1][0][2]["organization_name"] is not None)
            self.assertTrue(args[1][0][2]["organization_uuid"] is not None)
            self.assertEqual(args[1][0][2]["email"], email)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_add_wrong_email(self, mock_send_mail):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            email = "this is not a valid email"
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user", "email": email,},
            )
            self.assertEqual(response.status_code, 400)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_add_wrong_role(self, mock_send_mail):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            email = get_random_email()
            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "this does not look like valid role", "email": email,},
            )
            self.assertEqual(response.status_code, 400)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_add_existing_user_fails(self, mock_send_mail):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            email = get_random_email()

            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user", "email": email,},
            )

            self.assertEqual(response.status_code, 201)

            user = json.loads(response.data)
            users.update_user(uuid=user["uuid"], activated=datetime.now())

            response = c.post(
                "/organizations/%s/users" % UUID_ORG,
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"role": "user", "email": email,},
            )
            self.assertEqual(response.status_code, 409)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_cannot_delete_herself(self, mock_send_mail):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.delete(
                "/organizations/%s/users/%s" % (UUID_ORG, UUID_ADMIN),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 409)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_cannot_delete_unknown(self, mock_send_mail):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.delete(
                "/organizations/%s/users/%s" % (UUID_ORG, guid.uuid4()),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 404)
