import base64
import json
import unittest

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
    UUID_ADMIN,
    UUID_USER,
)
from server.database import api_tokens


def get_token_data(jwtoken):
    information = jwtoken.split(".")[1]
    information += "=" * (-len(information) % 4)
    return json.loads(base64.b64decode(information, "-_"))


class AuthenticateRoute(unittest.TestCase):
    def test_no_data(self):
        with app.test_client() as c:
            response = c.post("/users/me/authenticate")
            self.assertEqual(response.status_code, 400)

    def test_missing_username(self):
        with app.test_client() as c:
            response = c.post("/users/me/authenticate", json={"password": "random"})
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

    def test_returns_fresh_access_token(self):
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
            self.assertTrue("role" in response.json)
            self.assertTrue("force_pwd_change" in response.json)


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

    def test_returns_fresh_access_token(self):
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
            self.assertTrue("role" in response.json)
            self.assertTrue("force_pwd_change" in response.json)


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
            self.assertTrue("role" in response.json)
            self.assertTrue("force_pwd_change" in response.json)
            data = get_token_data(
                [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"][0].value
            )
            self.assertEqual(data["fresh"], False)
            self.assertEqual(data["type"], "access")
            self.assertEqual(data["identity"], UUID_USER)
            self.assertTrue("user_claims" in data)
            self.assertTrue("role" in data["user_claims"])
            self.assertTrue("force_pwd_change" in data["user_claims"])


class ChangePasswordRoute(unittest.TestCase):
    def test_missing_jwt(self):
        with app.test_client() as c:
            response = c.patch(
                "users/me",
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
                "users/me",
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
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_EXPIRED_CSRF},
                json={
                    "password": "admin-password",
                    "new_password_confirmation": "random",
                    "new_password": "random",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_mismatch_token_uuid(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "password": "user-password",
                    "new_password_confirmation": "random",
                    "new_password": "random",
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch("users/me", headers={"x-csrf-token": TOKEN_ADMIN_CSRF})
            self.assertEqual(response.status_code, 400)

    def test_missing_new_password(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"password": "random", "new_password_confirmation": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_new_password_confirmation(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"password": "random", "new_password": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_password(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.patch(
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"new_password_confirmation": "random", "new_password": "random"},
            )
            self.assertEqual(response.status_code, 400)

    def test_missing_auth(self):
        with app.test_client() as c:
            response = c.patch(
                "users/me",
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
                "users/me",
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
                "users/me",
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
                "users/me",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={
                    "new_password_confirmation": "random",
                    "new_password": "random",
                    "password": "admin-password",
                },
            )
            self.assertEqual(change.status_code, 200)
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
            c.set_cookie("localhost", "access_token_cookie", new_token)
            change_back = c.patch(
                "users/me",
                headers={"x-csrf-token": new_csrf},
                json={
                    "new_password_confirmation": "admin-password",
                    "new_password": "admin-password",
                    "password": "random",
                },
            )
            self.assertEqual(change_back.status_code, 200)


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

    def test_returns_eternal_access_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "users/me/tokens",
                headers={"x-csrf-token": TOKEN_USER_CSRF},
                json={"name": "my-pretty-token"},
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
            self.assertTrue("role" in data["user_claims"])
            self.assertTrue("force_pwd_change" not in data["user_claims"])
            self.assertEqual(data["user_claims"]["role"], "user")
            token = api_tokens.get_token(data["jti"])
            self.assertTrue(token is not None)
            self.assertEqual(token["user_uuid"], UUID_USER)

    def test_returns_user_role_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "users/me/tokens",
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
                json={"name": "my-pretty-token"},
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
            self.assertTrue("role" in data["user_claims"])
            self.assertTrue("force_pwd_change" not in data["user_claims"])
            self.assertEqual(data["user_claims"]["role"], "user")
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
                json={"name": "my-pretty-token"},
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
            response = c.get("/settings", headers={"x-csrf-token": self.token_csrf})
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
            response = c.get("/settings", headers={"x-csrf-token": self.token_csrf})
            self.assertEqual(response.status_code, 401)
