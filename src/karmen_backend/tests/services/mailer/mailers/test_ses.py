import os
import mock
import unittest
from botocore.exceptions import ClientError

from server.services.mailer.mailers.ses import Ses, get_client
from tests.utils import Response


class GetClientTest(unittest.TestCase):
    @mock.patch("server.app.config.get", return_value=None)
    def test_missing_config(self, mock_config):
        try:
            get_client()
        except RuntimeError as e:
            self.assertTrue("Cannot configure mailer" in str(e))

    @mock.patch(
        "server.app.config.get",
        return_value='{"aws_secret_key": 12, "aws_region": 123}',
    )
    def test_missing_access_key(self, mock_config):
        try:
            get_client()
        except RuntimeError as e:
            self.assertTrue("Missing" in str(e))

    @mock.patch(
        "server.app.config.get",
        return_value='{"aws_access_key": 12, "aws_region": 123}',
    )
    def test_missing_secret(self, mock_config):
        try:
            get_client()
        except RuntimeError as e:
            self.assertTrue("Missing" in str(e))

    @mock.patch(
        "server.app.config.get",
        return_value='{"aws_secret_key": 12, "aws_access_key": 123}',
    )
    def test_missing_region(self, mock_config):
        try:
            get_client()
        except RuntimeError as e:
            self.assertTrue("Missing" in str(e))

    @mock.patch(
        "server.app.config.get",
        return_value='{"aws_secret_key": "12", "aws_access_key": "123", "aws_region": "123"}',
    )
    def test_get_client(self, mock_config):
        cli = get_client()
        # TODO this might break with changes in ses api
        self.assertTrue(cli.verify_email_identity is not None)


class SendTest(unittest.TestCase):
    def setUp(self):
        self.ses = Ses()

    @mock.patch("server.services.mailer.mailers.ses.get_client")
    def test_send(self, mock_getclient):
        mock_getclient.return_value.send_email.return_value = True
        self.ses.send(
            "sender@example.com", "recipient@example.com", "Subject", "text", "html"
        )
        self.assertEqual(mock_getclient.return_value.send_email.call_count, 1)
        mock_getclient.return_value.send_email.assert_any_call(
            Destination={"ToAddresses": "recipient@example.com"},
            Message={
                "Body": {
                    "Html": {"Charset": "UTF-8", "Data": "html"},
                    "Text": {"Charset": "UTF-8", "Data": "text"},
                },
                "Subject": {"Charset": "UTF-8", "Data": "Subject"},
            },
            Source="sender@example.com",
        )

    @mock.patch("server.services.mailer.mailers.ses.get_client")
    def test_send_fila(self, mock_getclient):
        mock_getclient.return_value.send_email.return_value.side_effect = ClientError(
            {}, "bad_creds"
        )
        try:
            self.ses.send(
                "sender@example.com", "recipient@example.com", "Subject", "text", "html"
            )
            self.assertEqual(mock_getclient.return_value.send_email.call_count, 1)
        except RuntimeError as e:
            self.assertTrue("Cannot send mail" in str(e))
