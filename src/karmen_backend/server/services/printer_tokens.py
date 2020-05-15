import random
import string
import requests

from server import app


ISSUER_INSTANCE = None


class TokenIssuerUnavailable(Exception):
    pass


class TokenIssuerResponseMalformed(Exception):
    pass


class FakeTokenIssuer:
    def issue_token(self, user_uuid, iss="kcf"):
        """Issue a fake random token with a length of 20."""
        return (
            user_uuid
            + ":"
            + iss
            + ":"
            + "".join(random.choices(string.ascii_uppercase + string.digits, k=20))
        )


class TokenIssuer:
    def __init__(self, api_url):
        self.api_url = api_url
        self.session = requests.Session()

    def issue_token(self, user_uuid, iss="kcf"):
        try:
            resp = self.session.post("/key", data={"iss": iss, "sub": user_uuid})
        except (requests.ConnectionError, requests.ConnectTimeout) as exc:
            raise TokenIssuerUnavailable() from exc

        try:
            return resp.json()["token"]
        except Exception as exc:
            raise TokenIssuerResponseMalformed() from exc


def get_issuer():
    """Get a token issuer instance"""
    global ISSUER_INSTANCE

    token_server_api_url = app.config.get("TOKEN_SERVER_API_URL", None)

    if token_server_api_url is None:
        return FakeTokenIssuer()

    if ISSUER_INSTANCE is None:
        ISSUER_INSTANCE = TokenIssuer(token_server_api_url)

    return ISSUER_INSTANCE
