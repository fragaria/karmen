import json

from server import app


class Response:
    def __init__(self, status_code, contents={}):
        self.status_code = status_code
        self.contents = contents
        self.text = json.dumps(contents)

    def json(self):
        return self.contents


class SimpleResponse:
    def __init__(self, status_code, contents=""):
        self.status_code = status_code
        self.text = contents


# Keep these in sync with db/test-users.sql and db/migrations/V0013__organizations.sql and db/test-organizations.sql
UUID_ADMIN = "6480fa7d-ce18-4ae2-818b-f1d200050806"
UUID_USER = "77315957-8ebb-4a44-976c-758dbf28bb9f"
UUID_USER2 = "e076b705-a484-4d24-844d-02594ac40b12"
UUID_ORG = "b3060e41-e319-4a9b-8ac4-e0936c75f275"
UUID_ORG2 = "d973e553-122b-46bb-b852-d6ab4472dbd5"
UUID_GCODE = "806fa383-43df-4192-8e53-d556c6c583bc"

# walid to uuid check, but does not exist in db
UUID_INVALID = "1cae714b-6083-4020-a73f-35112516cf60"

TOKEN_ADMIN_EXPIRED = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1ODEzNDU4OTEsIm5iZiI6MTU4MTM0NTg5MSwianRpIjoiMDFmZTRkMGYtNWY3ZS00ZWE1LWI2ZTYtMTdkZjJhYWRhOGQ5IiwiZXhwIjoxNTgxMzQ2NzkxLCJpZGVudGl0eSI6IjY0ODBmYTdkLWNlMTgtNGFlMi04MThiLWYxZDIwMDA1MDgwNiIsImZyZXNoIjp0cnVlLCJ0eXBlIjoiYWNjZXNzIiwidXNlcl9jbGFpbXMiOnsicm9sZSI6ImFkbWluIiwidXNlcm5hbWUiOiJ0ZXN0LWFkbWluIiwiZm9yY2VfcHdkX2NoYW5nZSI6ZmFsc2V9LCJjc3JmIjoiODdkYzNhNWMtNzQ0Zi00ZDBlLTliYjItNjhlMjE0MzIwYjNmIn0.f2-SAlaSiBuPtwYUV1vz7Ax7vlaHgFlBu1XAOirtldc"
TOKEN_ADMIN_EXPIRED_CSRF = "387c0717-648d-4967-a732-9515af7f34d9"
API_TOKEN_ADMIN = None
TOKEN_ADMIN = None
TOKEN_ADMIN_CSRF = None
TOKEN_ADMIN_REFRESH = None
TOKEN_ADMIN_REFRESH_CSRF = None
TOKEN_ADMIN_NONFRESH = None
TOKEN_ADMIN_NONFRESH_CSRF = None
API_TOKEN_USER = None
TOKEN_USER = None
TOKEN_USER_CSRF = None
TOKEN_USER_REFRESH = None
TOKEN_USER_REFRESH_CSRF = None
TOKEN_USER2 = None
TOKEN_USER2_REFRESH = None
TOKEN_USER2_CSRF = None

LOCAL_TESTS_TOKEN = (
    "This token is to enable local admin used for tests and to verify requests to it"
)

with app.test_client() as c:
    response = c.post(
        "/users/me/authenticate",
        json={"username": "test-admin", "password": "admin-password"},
    )
    TOKEN_ADMIN = [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"][
        0
    ].value
    TOKEN_ADMIN_CSRF = [ck for ck in c.cookie_jar if ck.name == "csrf_access_token"][
        0
    ].value
    TOKEN_ADMIN_REFRESH = [
        ck for ck in c.cookie_jar if ck.name == "refresh_token_cookie"
    ][0].value
    TOKEN_ADMIN_REFRESH_CSRF = [
        ck for ck in c.cookie_jar if ck.name == "csrf_refresh_token"
    ][0].value
    response = c.post(
        "/users/me/tokens",
        headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
        json={"name": "apitoken", "organization_uuid": UUID_ORG},
    )
    API_TOKEN_ADMIN = response.json["access_token"]
    c.cookie_jar.clear()
    c.set_cookie("localhost", "refresh_token_cookie", TOKEN_ADMIN_REFRESH)
    response = c.post(
        "/users/me/authenticate-refresh",
        headers={"x-csrf-token": TOKEN_ADMIN_REFRESH_CSRF},
    )
    TOKEN_ADMIN_NONFRESH = [
        ck for ck in c.cookie_jar if ck.name == "access_token_cookie"
    ][0].value
    TOKEN_ADMIN_NONFRESH_CSRF = [
        ck for ck in c.cookie_jar if ck.name == "csrf_access_token"
    ][0].value
    c.cookie_jar.clear()
    response = c.post(
        "/users/me/authenticate",
        json={"username": "test-user", "password": "user-password"},
    )
    TOKEN_USER = [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"][
        0
    ].value
    TOKEN_USER_CSRF = [ck for ck in c.cookie_jar if ck.name == "csrf_access_token"][
        0
    ].value
    TOKEN_USER_REFRESH = [
        ck for ck in c.cookie_jar if ck.name == "refresh_token_cookie"
    ][0].value
    TOKEN_USER_REFRESH_CSRF = [
        ck for ck in c.cookie_jar if ck.name == "csrf_refresh_token"
    ][0].value
    response = c.post(
        "/users/me/tokens",
        headers={"x-csrf-token": TOKEN_USER_CSRF},
        json={"name": "apitoken", "organization_uuid": UUID_ORG},
    )
    API_TOKEN_USER = response.json["access_token"]
    c.cookie_jar.clear()
    response = c.post(
        "/users/me/authenticate",
        json={"username": "test-user-2", "password": "user-password"},
    )
    TOKEN_USER2 = [ck for ck in c.cookie_jar if ck.name == "access_token_cookie"][
        0
    ].value
    TOKEN_USER2_CSRF = [ck for ck in c.cookie_jar if ck.name == "csrf_access_token"][
        0
    ].value
    TOKEN_USER2_REFRESH = [
        ck for ck in c.cookie_jar if ck.name == "refresh_token_cookie"
    ][0].value


FLASK = True


if FLASK:
    ApiTestClient = app.test_client
else:
    import requests
    class ApiTestClient:
        def __init__(self):
            self.s = requests.Session()
            self.s.post(
                "http://localhost:4001/users/me/authenticate",
                json={"username": "test-admin", "password": "admin-password"},
            )

        def __enter__(self):
           return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

        def post(self, url, **kwargs):
            return self.s.post(f"http://localhost:4001{url}", **kwargs)

        def get(self, url, **kwargs):
            return self.s.get(f"http://localhost:4001{url}", **kwargs)

