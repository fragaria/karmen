import unittest
import mock

from server import app
from server.tasks.send_mail import send_mail


class SendMailTest(unittest.TestCase):
    @mock.patch("server.tasks.send_mail.app.logger.error")
    @mock.patch("server.app.config.get", return_value="random")
    def test_bad_mailer(self, mock_config_get, mock_logger):
        send_mail("aa@example.com", "template")
        self.assertEqual(mock_logger.call_count, 1)

    @mock.patch("server.tasks.send_mail.app.logger.error")
    def test_bad_template(self, mock_logger):
        send_mail("aa@example.com", "template")
        self.assertEqual(mock_logger.call_count, 1)

    @mock.patch("server.tasks.send_mail.app.logger.error")
    @mock.patch("server.tasks.send_mail.get_mailer")
    @mock.patch("server.tasks.send_mail.get_template")
    def test_send_mail(self, mock_template, mock_mailer, mock_logger):
        send_mail("aa@example.com", "PASSWORD_RESET_LINK")
        self.assertEqual(mock_logger.call_count, 0)
        self.assertEqual(mock_template.return_value.prepare_variables.call_count, 1)
        self.assertEqual(mock_mailer.return_value.send.call_count, 1)
