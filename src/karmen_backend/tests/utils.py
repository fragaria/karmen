from server import app


class Response:
    def __init__(self, status_code, contents={}):
        self.status_code = status_code
        self.contents = contents

    def json(self):
        return self.contents


# Expired at 1573656402, tied to 6480fa7d-ce18-4ae2-818b-f1d200050806 account
TOKEN_ADMIN_EXPIRED = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1NzM2NTU1MDIsIm5iZiI6MTU3MzY1NTUwMiwianRpIjoiMWIyYThkYTEtYzZmYy00YjJmLWI5NzItYzI3NjNiY2E0NzE2IiwiZXhwIjoxNTczNjU2NDAyLCJpZGVudGl0eSI6IjY0ODBmYTdkLWNlMTgtNGFlMi04MThiLWYxZDIwMDA1MDgwNiIsImZyZXNoIjp0cnVlLCJ0eXBlIjoiYWNjZXNzIiwidXNlcl9jbGFpbXMiOnsicm9sZSI6ImFkbWluIiwiZm9yY2VfcHdkX2NoYW5nZSI6ZmFsc2V9fQ.QzVBK9_0t3jcK_aUq9swMWEyl3u6pZtRZDFv-JiH9pI"
TOKEN_ADMIN = None
TOKEN_ADMIN_REFRESH = None
TOKEN_ADMIN_NONFRESH = None
TOKEN_USER = None
TOKEN_USER_REFRESH = None
TOKEN_USER2 = None
TOKEN_USER2_REFRESH = None

with app.test_client() as c:
    response = c.post(
        "/users/authenticate",
        json={"username": "test-admin", "password": "admin-password"},
    )
    TOKEN_ADMIN = response.json["access_token"]
    TOKEN_ADMIN_REFRESH = response.json["refresh_token"]
    response = c.post(
        "/users/authenticate-refresh",
        headers={"Authorization": "Bearer %s" % (response.json["refresh_token"],)},
    )
    TOKEN_ADMIN_NONFRESH = response.json["access_token"]
    response = c.post(
        "/users/authenticate",
        json={"username": "test-user", "password": "user-password"},
    )
    TOKEN_USER = response.json["access_token"]
    TOKEN_USER_REFRESH = response.json["refresh_token"]
    response = c.post(
        "/users/authenticate",
        json={"username": "test-user-2", "password": "user-password"},
    )
    TOKEN_USER2 = response.json["access_token"]
    TOKEN_USER2_REFRESH = response.json["refresh_token"]
