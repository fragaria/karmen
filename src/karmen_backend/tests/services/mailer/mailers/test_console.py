import mock
import unittest
from server.services.mailer.mailers.console import ConsoleMailer


class SendTest(unittest.TestCase):

    @mock.patch("server.services.mailer.mailers.console.app.config", {"MAILER_CONFIG": '{"print_html": true}'})
    @mock.patch("server.services.mailer.mailers.console.print")
    def test_printsprints_to_console(self, mock_print):
        mailer = ConsoleMailer()
        mailer.send(
            "sender@example.com", ("recipient@example.com", ), "Subject", "text content", "html content"
        )
        self.assertTrue("html content" in mock_print.call_args.args[0])
        self.assertTrue("text content" in mock_print.call_args.args[0])
        self.assertTrue("Subject" in mock_print.call_args.args[0])
        self.assertTrue("recipient@example.com" in mock_print.call_args.args[0])
        self.assertTrue("sender@example.com" in mock_print.call_args.args[0])

    @mock.patch("server.services.mailer.mailers.console.app.config", {"MAILER_CONFIG": '{"print_html": false}'})
    @mock.patch("server.services.mailer.mailers.console.print")
    def test_do_not_print_html(self, mock_print):
        mailer = ConsoleMailer()
        mailer.send(
            "sender@example.com", "recipient@example.com", "Subject", "text content", "html content"
        )
        self.assertFalse("html content" in mock_print.call_args.args[0])
        self.assertTrue("text content" in mock_print.call_args.args[0])
