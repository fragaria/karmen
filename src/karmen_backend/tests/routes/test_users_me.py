import hashlib
import uuid as guid
import random
import string
import base64
import json
import mock
import unittest
from datetime import datetime, timedelta

from server import app
from ..utils import (
    TOKEN_ADMIN_EXPIRED,
    TOKEN_ADMIN_EXPIRED_CSRF,
    TOKEN_ADMIN_NONFRESH,
    TOKEN_ADMIN_NONFRESH_CSRF,
    TOKEN_ADMIN,
    TOKEN_ADMIN_CSRF,
    TOKEN_USER,
    TOKEN_USER_CSRF,
    TOKEN_USER_REFRESH,
    TOKEN_USER_REFRESH_CSRF,
    TOKEN_USER2,
    TOKEN_USER2_CSRF,
    UUID_ADMIN,
    UUID_USER,
    UUID_ORG,
)
from server.database import api_tokens, users, local_users, organization_roles


def get_token_data(jwtoken):
    information = jwtoken.split(".")[1]
    information += "=" * (-len(information) % 4)
    return json.loads(base64.b64decode(information, "-_"))


def get_random_email():
    alphabet = string.ascii_lowercase
    return "user-%s@ktest.local" % "".join(random.sample(alphabet, 10))


class CreateNewUserRoute(unittest.TestCase):
    def test_fail_no_data(self):
        with app.test_client() as c:
            response = c.post("/users/me")
            self.assertEqual(response.status_code, 400)

    def test_fail_bad_mail(self):
        with app.test_client() as c:
            response = c.post("/users/me", json={"email": "something"})
            self.assertEqual(response.status_code, 400)

    def test_create_inactive_user(self):
        with app.test_client() as c:
            email = get_random_email()
            # this is testing whitespace truncate and casing as well
            response = c.post("/users/me", json={"email": "   %s    " % email.upper()})
            user = users.get_by_email(email)
            self.assertTrue(user is not None)
            self.assertEqual(user["providers"], [])
            self.assertEqual(user["email"], email)
            self.assertEqual(user["username"], email)
            self.assertEqual(user["activated"], None)
            self.assertTrue(user["activation_key_hash"] is not None)
            self.assertTrue(user["activation_key_expires"] is not None)
            self.assertTrue(
                user["activation_key_expires"]
                < (datetime.now().astimezone() + timedelta(minutes=15))
            )
            self.assertEqual(response.status_code, 202)

    def test_fail_conflict_active(self):
        with app.test_client() as c:
            response = c.post("/users/me", json={"email": "test-admin@karmen.local"})
            self.assertEqual(response.status_code, 202)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_reissue_activation_key(self, mock_send_mail):
        with app.test_client() as c:
            email = get_random_email()
            response = c.post("/users/me", json={"email": email})
            self.assertEqual(response.status_code, 202)
            user = users.get_by_email(email)
            self.assertTrue(user["activation_key_hash"] is not None)
            response = c.post("/users/me", json={"email": email})
            self.assertEqual(response.status_code, 202)
            user2 = users.get_by_email(email)
            self.assertTrue(user["activation_key_hash"] != user2["activation_key_hash"])
            self.assertEqual(mock_send_mail.call_count, 2)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_send_activation_mail(self, mock_send_mail):
        with app.test_client() as c:
            email = get_random_email()
            response = c.post("/users/me", json={"email": email})
            self.assertEqual(response.status_code, 202)
            self.assertEqual(mock_send_mail.call_count, 1)
            args = mock_send_mail.call_args_list
            self.assertEqual(args[0][0][0][0], email)
            self.assertEqual(args[0][0][1], "REGISTRATION_VERIFICATION_EMAIL")
            self.assertTrue(args[0][0][2]["activation_key"] is not None)
            self.assertTrue(args[0][0][2]["activation_key_expires"] is not None)
            self.assertEqual(args[0][0][2]["email"], email)


class ActivateNewUserRoute(unittest.TestCase):
    def setUp(self):
        self.email = get_random_email()
        self.activation_key = guid.uuid4()
        self.user_uuid = guid.uuid4()
        users.add_user(
            uuid=self.user_uuid,
            username=self.email,
            email=self.email,
            system_role="user",
            providers=[],
            activation_key_hash=hashlib.sha256(
                str(self.activation_key).encode("utf-8")
            ).hexdigest(),
            activation_key_expires=datetime.now().astimezone() + timedelta(minutes=10),
        )

    def test_fail_no_data(self):
        with app.test_client() as c:
            response = c.post("/users/me/activate")
            self.assertEqual(response.status_code, 400)

    def test_fail_bad_mail(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/activate",
                json={
                    "email": "something",
                    "activation_key": self.activation_key,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_missing_activation_key(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/activate",
                json={
                    "email": self.email,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_password_missing(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/activate",
                json={"email": self.email, "activation_key": self.activation_key},
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_password_mismatch(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/activate",
                json={
                    "email": self.email,
                    "activation_key": self.activation_key,
                    "password": "aaa",
                    "password_confirmation": "bbb",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_unknown_email(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/activate",
                json={
                    "email": "certainly@notanaccount.com",
                    "activation_key": "1234",
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_bad_activation_key(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/activate",
                json={
                    "email": self.email,
                    "activation_key": "1234",
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_expired_activation_key(self):
        email = get_random_email()
        activation_key = "1234"
        users.add_user(
            uuid=guid.uuid4(),
            username=email,
            email=email,
            system_role="user",
            providers=[],
            activation_key_hash=hashlib.sha256(
                str(activation_key).encode("utf-8")
            ).hexdigest(),
            activation_key_expires=datetime.now().astimezone() - timedelta(minutes=10),
        )
        with app.test_client() as c:
            response = c.post(
                "/users/me/activate",
                json={
                    "email": email,
                    "activation_key": activation_key,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_activate_user_with_default_org(self):
        with app.test_client() as c:
            self.assertTrue(
                len(organization_roles.get_by_user_uuid(self.user_uuid)) == 0
            )
            response = c.post(
                "/users/me/activate",
                json={
                    "email": self.email,
                    "activation_key": self.activation_key,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 204)
            user = users.get_by_uuid(self.user_uuid)
            self.assertTrue(user is not None)
            self.assertTrue(user["activated"] is not None)
            local_user = local_users.get_local_user(self.user_uuid)
            self.assertTrue(local_user is not None)
            self.assertTrue(
                len(organization_roles.get_by_user_uuid(self.user_uuid)) == 1
            )

    def test_already_active_user(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/activate",
                json={
                    "email": self.email,
                    "activation_key": self.activation_key,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 204)
            response = c.post(
                "/users/me/activate",
                json={
                    "email": self.email,
                    "activation_key": self.activation_key,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 409)


class RequestResetPasswordRoute(unittest.TestCase):
    def test_fail_missing_email(self):
        with app.test_client() as c:
            response = c.post("/users/me/request-password-reset")
            self.assertEqual(response.status_code, 400)

    def test_fail_bad_email(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/request-password-reset", json={"email": "not an email"}
            )
            self.assertEqual(response.status_code, 400)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_fail_unknown_email(self, mock_send_mail):
        with app.test_client() as c:
            response = c.post(
                "/users/me/request-password-reset",
                json={"email": "certainly@notauser.com"},
            )
            self.assertEqual(response.status_code, 202)
            self.assertEqual(mock_send_mail.call_count, 0)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_fail_inactive_user(self, mock_send_mail):
        with app.test_client() as c:
            email = get_random_email()
            c.post("/users/me", json={"email": email})
            response = c.post("/users/me/request-password-reset", json={"email": email})
            self.assertEqual(response.status_code, 202)
            # The 1 sent mail is the activation one when user is registered
            self.assertEqual(mock_send_mail.call_count, 1)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_send_email_with_reset_link(self, mock_send_mail):
        with app.test_client() as c:
            email = get_random_email()
            c.post("/users/me", json={"email": email})
            user = users.get_by_email(email)
            users.update_user(uuid=user["uuid"], activated=datetime.now())
            local_users.add_local_user(
                user_uuid=user["uuid"], pwd_hash="aaa", force_pwd_change=False
            )
            response = c.post("/users/me/request-password-reset", json={"email": email})
            self.assertEqual(response.status_code, 202)
            self.assertEqual(mock_send_mail.call_count, 2)
            args = mock_send_mail.call_args_list
            self.assertEqual(args[1][0][0][0], email)
            self.assertEqual(args[1][0][1], "PASSWORD_RESET_LINK")
            self.assertTrue(args[1][0][2]["pwd_reset_key"] is not None)
            self.assertTrue(args[1][0][2]["pwd_reset_key_expires"] is not None)
            self.assertEqual(args[1][0][2]["email"], email)

    def test_login__still_works_after_reset_request(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/request-password-reset",
                json={"email": "test-admin@karmen.local"},
            )
            self.assertEqual(response.status_code, 202)

            response = c.post(
                "/users/me/authenticate",
                json={"username": "test-admin", "password": "admin-password"},
            )
            self.assertEqual(response.status_code, 200)


class ResetPasswordRoute(unittest.TestCase):
    def setUp(self):
        self.email = get_random_email()
        self.pwd_reset_key = guid.uuid4()
        self.user_uuid = guid.uuid4()
        users.add_user(
            uuid=self.user_uuid,
            username=self.email,
            email=self.email,
            system_role="user",
            providers=["local"],
            activated=datetime.now(),
        )
        local_users.add_local_user(
            user_uuid=self.user_uuid,
            pwd_hash="1234",
            pwd_reset_key_hash=hashlib.sha256(
                str(self.pwd_reset_key).encode("utf-8")
            ).hexdigest(),
            pwd_reset_key_expires=datetime.now().astimezone() + timedelta(minutes=10),
            force_pwd_change=False,
        )

    def test_fail_no_data(self):
        with app.test_client() as c:
            response = c.post("/users/me/reset-password")
            self.assertEqual(response.status_code, 400)

    def test_fail_bad_mail(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/reset-password",
                json={
                    "email": "something",
                    "pwd_reset_key": self.pwd_reset_key,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_missing_pwd_reset_key(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/reset-password",
                json={
                    "email": self.email,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_unknown_email(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/reset-password",
                json={
                    "email": "certainly@notanaccount.com",
                    "pwd_reset_key": "1234",
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_password_missing(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/reset-password",
                json={"email": self.email, "pwd_reset_key": self.pwd_reset_key},
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_password_mismatch(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/reset-password",
                json={
                    "email": self.email,
                    "pwd_reset_key": self.pwd_reset_key,
                    "password": "aaa",
                    "password_confirmation": "bbb",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_bad_pwd_reset_key(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/reset-password",
                json={
                    "email": self.email,
                    "pwd_reset_key": "1234",
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_fail_expired_pwd_reset_key(self):
        email = get_random_email()
        pwd_reset_key = "1234"
        user_uuid = guid.uuid4()
        users.add_user(
            uuid=user_uuid,
            username=email,
            email=email,
            system_role="user",
            providers=["local"],
            activated=datetime.now(),
        )
        local_users.add_local_user(
            user_uuid=user_uuid,
            pwd_hash="1234",
            pwd_reset_key_hash=hashlib.sha256(
                str(pwd_reset_key).encode("utf-8")
            ).hexdigest(),
            pwd_reset_key_expires=datetime.now().astimezone() - timedelta(minutes=10),
            force_pwd_change=False,
        )
        with app.test_client() as c:
            response = c.post(
                "/users/me/reset-password",
                json={
                    "email": email,
                    "pwd_reset_key": pwd_reset_key,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 400)

    @mock.patch("server.tasks.send_mail.send_mail.delay")
    def test_reset_password(self, mock_send_mail):
        with app.test_client() as c:
            response = c.post(
                "/users/me/reset-password",
                json={
                    "email": self.email,
                    "pwd_reset_key": self.pwd_reset_key,
                    "password": "aaa",
                    "password_confirmation": "aaa",
                },
            )
            self.assertEqual(response.status_code, 204)
            local_user = local_users.get_local_user(self.user_uuid)
            self.assertTrue(local_user["pwd_reset_key_hash"] is None)
            self.assertTrue(local_user["pwd_reset_key_expires"] is None)
            self.assertEqual(mock_send_mail.call_count, 1)
            args = mock_send_mail.call_args_list
            self.assertEqual(args[0][0][0][0], self.email)
            self.assertEqual(args[0][0][1], "PASSWORD_RESET_CONFIRMATION")
            self.assertEqual(args[0][0][2]["email"], self.email)


class AuthenticateRoute(unittest.TestCase):
    def test_no_data(self):
        with app.test_client() as c:
            response = c.post("/users/me/authenticate")
            self.assertEqual(response.status_code, 400)

    def test_missing_password(self):
        with app.test_client() as c:
            response = c.post("/users/me/authenticate", json={"username": "random"})
            self.assertEqual(response.status_code, 400)

    def test_unknown_user(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate",
                json={"username": "random", "password": "random"},
            )
            self.assertEqual(response.status_code, 401)

    def test_bad_password(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate",
                json={"username": "test-admin", "password": "random"},
            )
            self.assertEqual(response.status_code, 401)

    def test_returns_fresh_access_token_username(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate",
                json={"username": "test-admin", "password": "admin-password"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("access_token" not in response.json)
            self.assertTrue("refresh_token" not in response.json)
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "refresh_token_cookie"]
                is not None
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"]
                is not None
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "csrf_refresh_token"]
                is not None
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "csrf_access_token"]
                is not None
            )
            self.assertEqual(response.json["fresh"], True)
            self.assertEqual(response.json["identity"], UUID_ADMIN)
            self.assertTrue("expires_on" in response.json)
            self.assertTrue("system_role" in response.json)
            self.assertTrue("force_pwd_change" in response.json)
            self.assertTrue("organizations" in response.json)
            self.assertTrue(UUID_ORG in response.json["organizations"])
            self.assertTrue(
                response.json["organizations"][UUID_ORG]["name"]
                == "Default organization"
            )
            self.assertTrue(response.json["organizations"][UUID_ORG]["role"] == "admin")

    def test_returns_fresh_access_token_email(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate",
                json={
                    # tests truncate and casing as well
                    "username": "  TEST-admin@karmen.local  ",
                    "password": "admin-password",
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("access_token" not in response.json)
            self.assertTrue("refresh_token" not in response.json)
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "refresh_token_cookie"]
                is not None
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"]
                is not None
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "csrf_refresh_token"]
                is not None
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "csrf_access_token"]
                is not None
            )
            self.assertEqual(response.json["fresh"], True)
            self.assertEqual(response.json["identity"], UUID_ADMIN)
            self.assertTrue("expires_on" in response.json)
            self.assertTrue("system_role" in response.json)
            self.assertTrue("force_pwd_change" in response.json)
            self.assertTrue("organizations" in response.json)
            self.assertTrue(UUID_ORG in response.json["organizations"])
            self.assertTrue(
                response.json["organizations"][UUID_ORG]["name"]
                == "Default organization"
            )
            self.assertTrue(response.json["organizations"][UUID_ORG]["role"] == "admin")


class AuthenticateFreshRoute(unittest.TestCase):
    def test_no_data(self):
        with app.test_client() as c:
            response = c.post("/users/me/authenticate-fresh")
            self.assertEqual(response.status_code, 400)

    def test_missing_username(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate-fresh", json={"password": "random"}
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_password(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate-fresh", json={"username": "random"}
            )
            self.assertEqual(response.status_code, 400)

    def test_unknown_user(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate-fresh",
                json={"username": "random", "password": "random"},
            )
            self.assertEqual(response.status_code, 401)

    def test_bad_password(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate-fresh",
                json={"username": "test-admin", "password": "random"},
            )
            self.assertEqual(response.status_code, 401)

    def test_returns_fresh_access_token_username(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate-fresh",
                json={"username": "test-admin", "password": "admin-password"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("access_token" not in response.json)
            self.assertTrue("refresh_token" not in response.json)
            self.assertTrue(
                len([ck for ck in c.cookie_jar if ck.name == "refresh_token_cookie"])
                is 0
            )
            self.assertTrue(
                len([ck for ck in c.cookie_jar if ck.name == "csrf_refresh_token"]) is 0
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"]
                is not None
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "csrf_access_token"]
                is not None
            )
            self.assertEqual(response.json["fresh"], True)
            self.assertEqual(response.json["identity"], UUID_ADMIN)
            self.assertTrue("expires_on" in response.json)
            self.assertTrue("system_role" in response.json)
            self.assertTrue("force_pwd_change" in response.json)
            self.assertTrue("organizations" in response.json)

    def test_returns_fresh_access_token_email(self):
        with app.test_client() as c:
            response = c.post(
                "/users/me/authenticate-fresh",
                json={
                    "username": "test-admin@karmen.local",
                    "password": "admin-password",
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("access_token" not in response.json)
            self.assertTrue("refresh_token" not in response.json)
            self.assertTrue(
                len([ck for ck in c.cookie_jar if ck.name == "refresh_token_cookie"])
                is 0
            )
            self.assertTrue(
                len([ck for ck in c.cookie_jar if ck.name == "csrf_refresh_token"]) is 0
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"]
                is not None
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "csrf_access_token"]
                is not None
            )
            self.assertEqual(response.json["fresh"], True)
            self.assertEqual(response.json["identity"], UUID_ADMIN)
            self.assertTrue("expires_on" in response.json)
            self.assertTrue("system_role" in response.json)
            self.assertTrue("force_pwd_change" in response.json)
            self.assertTrue("organizations" in response.json)


class AuthenticateRefreshRoute(unittest.TestCase):
    def test_no_token(self):
        with app.test_client() as c:
            response = c.post("/users/me/authenticate-refresh")
            self.assertEqual(response.status_code, 401)

    def test_bad_token(self):
        with app.test_client() as c:
            c.set_cookie(
                "localhost",
                "refresh_token_cookie",
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0b3B0YWwuY29tIiwiZXhwIjoxNDI2NDIwODAwLCJodHRwOi8vdG9wdGFsLmNvbS9qd3RfY2xhaW1zL2lzX2FkbWluIjp0cnVlLCJjb21wYW55IjoiVG9wdGFsIiwiYXdlc29tZSI6dHJ1ZX0.yRQYnWzskCZUxPwaQupWkiUzKELZ49eM7oWxAQK_ZXw",
            )
            response = c.post(
                "/users/me/authenticate-refresh", headers={"X-CSRF-TOKEN": "123456"},
            )
            self.assertEqual(response.status_code, 422)

    def test_returns_nonfresh_access_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "refresh_token_cookie", TOKEN_USER_REFRESH)
            response = c.post(
                "/users/me/authenticate-refresh",
                headers={"X-CSRF-TOKEN": TOKEN_USER_REFRESH_CSRF},
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("access_token" not in response.json)
            self.assertTrue("refresh_token" not in response.json)
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"]
                is not None
            )
            self.assertTrue(
                [ck for ck in c.cookie_jar if ck.name == "csrf_access_token"]
                is not None
            )
            self.assertEqual(response.json["fresh"], False)
            self.assertEqual(response.json["identity"], UUID_USER)
            self.assertTrue("expires_on" in response.json)
            self.assertTrue("system_role" in response.json)
            self.assertTrue("force_pwd_change" in response.json)
            self.assertTrue("organizations" in response.json)
            data = get_token_data(
                [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"][0].value
            )
            self.assertEqual(data["fresh"], False)
            self.assertEqual(data["type"], "access")
            self.assertEqual(data["identity"], UUID_USER)
            self.assertTrue("user_claims" in data)
            self.assertTrue("system_role" not in data["user_claims"])
            self.assertTrue("force_pwd_change" in data["user_claims"])


class ChangePasswordRoute(unittest.TestCase):
    def test_missing_jwt(self):
        with app.test_client() as c:
            response = c.patch(
                "users/me/password",
                json={
                    "password": "random",
                    "new_password_confirmation": "random",
                    "new_password": "random",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_nonfresh_jwt(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_NONFRESH)
            response = c.patch(
                "users/me/password",
                headers={"x-csrf-token": TOKEN_ADMIN_NONFRESH_CSRF},
                json={
                    "password": "random",
                    "new_password_confirmation": "random",
                    "new_password": "random",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_expired_jwt(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_EXPIRED)
            response = c.patch(
                "users/me/password",
                headers={"x-csrf-token": TOKEN_ADMIN_EXPIRED_CSRF},
                json={
                    "password": "admin-password",
                    "new_password_confirmation": "random",
                    "new_password": "random",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me/password", headers={"x-csrf-token": TOKEN_ADMIN_CSRF}
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_new_password(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me/password",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"password": "random", "new_password_confirmation": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_new_password_confirmation(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me/password",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"password": "random", "new_password": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_password(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me/password",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"new_password_confirmation": "random", "new_password": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_auth(self):
        with app.test_client() as c:
            response = c.patch(
                "users/me/password",
                json={
                    "new_password_confirmation": "random",
                    "new_password": "random",
                    "password": "bad-password",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_new_pwd_mismatch(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me/password",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "new_password_confirmation": "random",
                    "new_password": "random-mismatch",
                    "password": "admin-password",
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_pwd(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me/password",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "new_password_confirmation": "random",
                    "new_password": "random",
                    "password": "bad-password",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_pwd_changed(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            change = c.patch(
                "users/me/password",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "new_password_confirmation": "random",
                    "new_password": "random",
                    "password": "admin-password",
                },
            )
            self.assertEqual(change.status_code, 200)
            c.cookie_jar.clear()
            auth = c.post(
                "/users/me/authenticate",
                json={"username": "test-admin", "password": "random"},
            )
            self.assertEqual(auth.status_code, 200)
            new_token = [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"][
                0
            ].value
            new_csrf = [ck for ck in c.cookie_jar if ck.name == "csrf_access_token"][
                0
            ].value
            c.cookie_jar.clear()
            c.set_cookie("localhost", "access_token_cookie", new_token)
            change_back = c.patch(
                "users/me/password",
                headers={"x-csrf-token": new_csrf},
                json={
                    "password": "random",
                    "new_password_confirmation": "admin-password",
                    "new_password": "admin-password",
                },
            )
            self.assertEqual(change_back.status_code, 200)


class PatchUser(unittest.TestCase):
    def test_missing_jwt(self):
        with app.test_client() as c:
            response = c.patch(
                "users/me", json={"username": "random", "email": "random",},
            )
            self.assertEqual(response.status_code, 401)

    def test_nonfresh_jwt(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_NONFRESH)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_NONFRESH_CSRF},
                json={"username": "random", "email": "random",},
            )
            self.assertEqual(response.status_code, 401)

    def test_expired_jwt(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN_EXPIRED)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_EXPIRED_CSRF},
                json={"username": "admin", "email": "random",},
            )
            self.assertEqual(response.status_code, 401)

    def test_missing_username(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"email": "random@random.com",},
            )
            self.assertEqual(response.status_code, 400)

    def test_change(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"username": get_random_email()},
            )
            self.assertEqual(response.status_code, 200)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"username": "test-admin"},
            )
            self.assertEqual(response.status_code, 200)

    def test_change_conflict_username(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"username": "test-user", "email": get_random_email()},
            )
            self.assertEqual(response.status_code, 400)


class ListApiTokensRoute(unittest.TestCase):
    def test_no_token(self):
        with app.test_client() as c:
            response = c.get("users/me/tokens")
            self.assertEqual(response.status_code, 401)

    def test_returns_token_list(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "users/me/tokens",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": "my-pretty-token"},
            )
            response = c.get(
                "users/me/tokens", headers={"x-csrf-token": TOKEN_USER_CSRF}
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue("items" in response.json)
            for token in response.json["items"]:
                self.assertTrue("name" in token)
                self.assertTrue("created" in token)
                self.assertTrue("organization" in token)
                self.assertTrue("uuid" in token["organization"])
                self.assertTrue("name" in token["organization"])
                db_token = api_tokens.get_token(token["jti"])
                self.assertEqual(db_token["user_uuid"], UUID_USER)
                self.assertFalse(db_token["revoked"])


class CreateApiTokenRoute(unittest.TestCase):
    def test_no_token(self):
        with app.test_client() as c:
            response = c.post("users/me/tokens")
            self.assertEqual(response.status_code, 401)

    def test_missing_name(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "users/me/tokens", headers={"x-csrf-token": TOKEN_USER_CSRF}
            )
            self.assertEqual(response.status_code, 400)

    def test_bad_organization(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER2)
            response = c.post(
                "users/me/tokens",
                headers={"x-csrf-token": TOKEN_USER2_CSRF},
                json={"name": "my-pretty-token", "organization_uuid": UUID_ORG},
            )
            self.assertEqual(response.status_code, 401)

    def test_returns_eternal_access_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "users/me/tokens",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": "my-pretty-token", "organization_uuid": UUID_ORG},
            )
            self.assertEqual(response.status_code, 201)
            self.assertTrue("access_token" in response.json)
            self.assertTrue("name" in response.json)
            self.assertTrue("jti" in response.json)
            self.assertTrue("refresh_token" not in response.json)
            data = get_token_data(response.json["access_token"])
            self.assertEqual(data["fresh"], False)
            self.assertEqual(data["type"], "access")
            self.assertEqual(data["identity"], UUID_USER)
            self.assertTrue("exp" not in data)
            self.assertTrue("user_claims" in data)
            self.assertTrue("system_role" not in data["user_claims"])
            self.assertTrue("force_pwd_change" not in data["user_claims"])
            self.assertTrue("organization_uuid" in data["user_claims"])
            self.assertTrue(data["user_claims"]["organization_uuid"] == UUID_ORG)
            token = api_tokens.get_token(data["jti"])
            self.assertTrue(token is not None)
            self.assertEqual(token["user_uuid"], UUID_USER)

    def test_returns_user_role_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "users/me/tokens",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "my-pretty-token", "organization_uuid": UUID_ORG},
            )
            self.assertEqual(response.status_code, 201)
            self.assertTrue("access_token" in response.json)
            self.assertTrue("name" in response.json)
            self.assertTrue("jti" in response.json)
            self.assertTrue("refresh_token" not in response.json)
            data = get_token_data(response.json["access_token"])
            self.assertEqual(data["fresh"], False)
            self.assertEqual(data["type"], "access")
            self.assertEqual(data["identity"], UUID_ADMIN)
            self.assertTrue("exp" not in data)
            self.assertTrue("user_claims" in data)
            self.assertTrue("system_role" not in data["user_claims"])
            self.assertTrue("force_pwd_change" not in data["user_claims"])
            self.assertTrue("organization_uuid" in data["user_claims"])
            self.assertTrue(data["user_claims"]["organization_uuid"] == UUID_ORG)
            token = api_tokens.get_token(data["jti"])
            self.assertTrue(token is not None)
            self.assertEqual(token["user_uuid"], UUID_ADMIN)


class RevokeApiTokenRoute(unittest.TestCase):
    def setUp(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "users/me/tokens",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": "my-pretty-token", "organization_uuid": UUID_ORG},
            )
            self.token = response.json["access_token"]
            self.token_jti = get_token_data(self.token)["jti"]
            self.token_csrf = get_token_data(self.token)["csrf"]

    def test_no_token(self):
        with app.test_client() as c:
            response = c.delete("/users/me/tokens/%s" % (self.token_jti))
            self.assertEqual(response.status_code, 401)

    def test_bad_user(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.delete(
                "/users/me/tokens/%s" % (self.token_jti),
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 401)

    def test_bad_jti(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.delete(
                "/users/me/tokens/%s" % (UUID_USER),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)

    def test_revokes_token_once(self):
        with app.test_client() as c:
            db_token = api_tokens.get_token(self.token_jti)
            self.assertFalse(db_token["revoked"])
            c.set_cookie("localhost", "access_token_cookie", self.token)
            response = c.get(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": self.token_csrf},
            )
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            self.assertEqual(response.status_code, 200)
            response = c.delete(
                "/users/me/tokens/%s" % (self.token_jti),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 204)
            db_token = api_tokens.get_token(self.token_jti)
            self.assertTrue(db_token["revoked"])
            response = c.delete(
                "/users/me/tokens/%s" % (self.token_jti),
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 404)
            c.set_cookie("localhost", "access_token_cookie", self.token)
            response = c.get(
                "/organizations/%s/printers" % UUID_ORG,
                headers={"x-csrf-token": self.token_csrf},
            )
            self.assertEqual(response.status_code, 401)
