import os
import mock
import unittest

from server.services.mailer.mailers.mailgun import Mailgun
from tests.utils import Response


class SendTest(unittest.TestCase):
    def setUp(self):
        self.mailgun = Mailgun()

    @mock.patch("server.app.config.get", return_value=None)
    def test_missing_config(self, mock_config):
        try:
            self.mailgun.send(
                "sender@example.com", "recipient@example.com", "Subject", "text", "html"
            )
        except RuntimeError as e:
            self.assertTrue("Cannot configure mailer" in str(e))

    @mock.patch("server.app.config.get", return_value='{"mailgun_api_key": "1234"}')
    def test_missing_domain(self, mock_config):
        try:
            self.mailgun.send(
                "sender@example.com", "recipient@example.com", "Subject", "text", "html"
            )
        except RuntimeError as e:
            self.assertTrue("Missing" in str(e))

    @mock.patch("server.app.config.get", return_value='{"mailgun_domain": "1234"}')
    def test_missing_apikey(self, mock_config):
        try:
            self.mailgun.send(
                "sender@example.com", "recipient@example.com", "Subject", "text", "html"
            )
        except RuntimeError as e:
            self.assertTrue("Missing" in str(e))

    @mock.patch(
        "server.services.mailer.mailers.mailgun.requests.post",
        return_value=Response(200),
    )
    @mock.patch(
        "server.app.config.get",
        return_value='{"mailgun_domain": "12345", "mailgun_api_key": "1234"}',
    )
    def test_send(self, mock_config, mock_request):
        self.mailgun.send(
            "sender@example.com", "recipient@example.com", "Subject", "text", "html"
        )
        self.assertTrue(mock_request.call_count, 1)
        mock_request.assert_any_call(
            "https://api.mailgun.net/v3/12345/messages",
            auth=("api", "1234"),
            data={
                "from": "sender@example.com",
                "to": "recipient@example.com",
                "subject": "Subject",
                "text": "text",
                "html": "html",
            },
        )

    @mock.patch(
        "server.services.mailer.mailers.mailgun.requests.post",
        return_value=Response(500),
    )
    @mock.patch(
        "server.app.config.get",
        return_value='{"mailgun_domain": "1234", "mailgun_api_key": "1234"}',
    )
    def test_mailgun_bad_response(self, mock_config, mock_request):
        try:
            self.mailgun.send(
                "sender@example.com", "recipient@example.com", "Subject", "text", "html"
            )
        except RuntimeError as e:
            self.assertTrue("Cannot send mail" in str(e))
