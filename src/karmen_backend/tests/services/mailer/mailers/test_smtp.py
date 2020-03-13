import os
import mock
import unittest

from server.services.mailer.mailers.smtp import Smtp
from tests.utils import Response


class SendTest(unittest.TestCase):
    def setUp(self):
        self.smtp = Smtp()

    @mock.patch("server.app.config.get", return_value=None)
    def test_missing_config(self, mock_config):
        try:
            self.smtp.send(
                "sender@example.com", "recipient@example.com", "Subject", "text", "html"
            )
        except RuntimeError as e:
            self.assertTrue("Cannot configure mailer" in str(e))

    @mock.patch("server.app.config.get", return_value='{"port": 12}')
    def test_missing_host(self, mock_config):
        try:
            self.smtp.send(
                "sender@example.com", "recipient@example.com", "Subject", "text", "html"
            )
        except RuntimeError as e:
            self.assertTrue("Missing" in str(e))

    @mock.patch("server.app.config.get", return_value='{"host": "1234"}')
    def test_missing_port(self, mock_config):
        try:
            self.smtp.send(
                "sender@example.com", "recipient@example.com", "Subject", "text", "html"
            )
        except RuntimeError as e:
            self.assertTrue("Missing" in str(e))

    @mock.patch("server.services.mailer.mailers.smtp.smtplib.SMTP_SSL")
    @mock.patch("server.services.mailer.mailers.smtp.smtplib.SMTP")
    @mock.patch(
        "server.app.config.get",
        return_value='{"host": "12345", "port": 1234, "ssl": 0}',
    )
    def test_send_plain(self, mock_config, mock_smtp, mock_smtp_ssl):
        self.smtp.send(
            "sender@example.com", "recipient@example.com", "Subject", "text", "html"
        )
        self.assertEqual(mock_smtp.call_count, 1)
        self.assertEqual(mock_smtp_ssl.call_count, 0)
        self.assertEqual(mock_smtp.return_value.login.call_count, 0)
        self.assertEqual(mock_smtp.return_value.sendmail.call_count, 1)
        self.assertEqual(mock_smtp.return_value.quit.call_count, 1)
        args, kwargs = mock_smtp.return_value.sendmail.call_args
        self.assertEqual(args[0], "sender@example.com")
        self.assertEqual(args[1], "recipient@example.com")

    @mock.patch("server.services.mailer.mailers.smtp.smtplib.SMTP_SSL")
    @mock.patch("server.services.mailer.mailers.smtp.smtplib.SMTP")
    @mock.patch(
        "server.app.config.get", return_value='{"host": "12345", "port": 1234}',
    )
    def test_send_default_ssl(self, mock_config, mock_smtp, mock_smtp_ssl):
        self.smtp.send(
            "sender@example.com", "recipient@example.com", "Subject", "text", "html"
        )
        self.assertEqual(mock_smtp.call_count, 0)
        self.assertEqual(mock_smtp_ssl.call_count, 1)
        self.assertEqual(mock_smtp.return_value.login.call_count, 0)
        self.assertEqual(mock_smtp_ssl.return_value.sendmail.call_count, 1)
        self.assertEqual(mock_smtp_ssl.return_value.quit.call_count, 1)

    @mock.patch("server.services.mailer.mailers.smtp.smtplib.SMTP_SSL")
    @mock.patch("server.services.mailer.mailers.smtp.smtplib.SMTP")
    @mock.patch(
        "server.app.config.get",
        return_value='{"host": "12345", "port": 1234, "login": "aa", "password": "pwd", "ssl": 0}',
    )
    def test_send_login_plain(self, mock_config, mock_smtp, mock_smtp_ssl):
        self.smtp.send(
            "sender@example.com", "recipient@example.com", "Subject", "text", "html"
        )
        self.assertEqual(mock_smtp.call_count, 1)
        self.assertEqual(mock_smtp_ssl.call_count, 0)
        self.assertEqual(mock_smtp.return_value.login.call_count, 1)
        self.assertEqual(mock_smtp.return_value.sendmail.call_count, 1)
        self.assertEqual(mock_smtp.return_value.quit.call_count, 1)

    @mock.patch("server.services.mailer.mailers.smtp.smtplib.SMTP_SSL")
    @mock.patch("server.services.mailer.mailers.smtp.smtplib.SMTP")
    @mock.patch(
        "server.app.config.get",
        return_value='{"host": "12345", "port": 1234, "login": "aa", "password": "pwd"}',
    )
    def test_send_login_ssl(self, mock_config, mock_smtp, mock_smtp_ssl):
        self.smtp.send(
            "sender@example.com", "recipient@example.com", "Subject", "text", "html"
        )
        self.assertEqual(mock_smtp.call_count, 0)
        self.assertEqual(mock_smtp_ssl.call_count, 1)
        self.assertEqual(mock_smtp_ssl.return_value.login.call_count, 1)
        self.assertEqual(mock_smtp_ssl.return_value.sendmail.call_count, 1)
        self.assertEqual(mock_smtp_ssl.return_value.quit.call_count, 1)
