import mock
import pytest
import requests

from server import app
from server.services import printer_tokens

from ..utils import UUID_USER, Response


TOKEN_SERVER_FAKE_URL = "https://token-server.org"


@pytest.fixture
def mock_issuer():
    original = app.config["TOKEN_SERVER_API_URL"]
    app.config["TOKEN_SERVER_API_URL"] = TOKEN_SERVER_FAKE_URL
    yield printer_tokens.get_issuer()
    app.config["TOKEN_SERVER_API_URL"] = original


@pytest.mark.parametrize(
    "issuer_url, issuer_cls",
    (
        (None, printer_tokens.FakeTokenIssuer),
        (TOKEN_SERVER_FAKE_URL, printer_tokens.TokenIssuer),
    ),
)
def test_proper_issuer_is_created(issuer_url, issuer_cls):
    original = app.config["TOKEN_SERVER_API_URL"]
    app.config["TOKEN_SERVER_API_URL"] = issuer_url

    try:
        issuer = printer_tokens.get_issuer()
        assert isinstance(issuer, issuer_cls)
    except Exception as exc:
        raise exc
    finally:
        app.config["TOKEN_SERVER_API_URL"] = original


@mock.patch(
    "server.clients.octoprint.requests.Session.post",
    return_value=Response(200, {"token": "atoken"}),
)
def test_key_issuer(session_mock, mock_issuer):
    token = mock_issuer.issue_token(UUID_USER)
    session_mock.assert_called_with(
        f"{TOKEN_SERVER_FAKE_URL}/key?iss=kcf&sub={UUID_USER}"
    )
    assert token == "atoken"


@mock.patch(
    "server.clients.octoprint.requests.Session.post", return_value=Response(200, {})
)
def test_key_issuer_raises_malformed(session_mock, mock_issuer):
    with pytest.raises(printer_tokens.TokenIssuerResponseMalformed):
        mock_issuer.issue_token(UUID_USER)


@mock.patch(
    "server.clients.octoprint.requests.Session.post",
    side_effect=requests.exceptions.ConnectionError(),
)
def test_key_issuer_raises_connection_error(session_mock, mock_issuer):
    with pytest.raises(printer_tokens.TokenIssuerUnavailable):
        mock_issuer.issue_token(UUID_USER)


@mock.patch(
    "server.clients.octoprint.requests.Session.post",
    return_value=Response(400, {"message": "Some message"}),
)
def test_key_issuer_raises_comm_error(session_mock, mock_issuer):
    with pytest.raises(printer_tokens.TokenIssuerCommunicationError):
        mock_issuer.issue_token(UUID_USER)
