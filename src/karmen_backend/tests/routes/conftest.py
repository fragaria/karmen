import pytest
import string
import random
from server import app


@pytest.fixture()
def client():
    return app.test_client()


@pytest.fixture()
def random_name():
    alphabet = string.ascii_lowercase
    return "org %s" % "".join(random.sample(alphabet, 10))


def get_tokens(client, username, password):
    response = client.post(
        "/users/me/authenticate", json={"username": username, "password": password},
    )
    token = [ck for ck in client.cookie_jar if ck.name == "access_token_cookie"][
        0
    ].value
    csrf_token = [ck for ck in client.cookie_jar if ck.name == "csrf_access_token"][
        0
    ].value
    refresh_token = [ck for ck in client.cookie_jar if ck.name == "csrf_refresh_token"][
        0
    ].value
    return {"token": token, "csrf_token": csrf_token, "refresh_token": refresh_token}


@pytest.fixture()
def user_tokens(client):
    return get_tokens(client, "test-user", "user-password")


@pytest.fixture()
def admin_tokens(client):
    return get_tokens(client, "test-admin", "admin-password")
