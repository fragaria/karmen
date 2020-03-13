import os
import unittest

from server.services.mailer import get_mailer, get_template
from server.services.mailer.mailers.ses import Ses
from server.services.mailer.templates.password_reset_link import PasswordResetLink


class GetMailerTest(unittest.TestCase):
    def test_unknown_mailer(self):
        with self.assertRaises(RuntimeError) as context:
            get_mailer("random")
            self.assertTrue("Unknown mailer random" in str(context.exception))

    def test_known_mailer_lowercase(self):
        ses_mailer = get_mailer("ses")
        self.assertTrue(isinstance(ses_mailer, Ses))

    def test_known_mailer_mixedcase(self):
        ses_mailer = get_mailer("Ses")
        self.assertTrue(isinstance(ses_mailer, Ses))


class GetTemplateTest(unittest.TestCase):
    def test_unknown_template(self):
        with self.assertRaises(RuntimeError) as context:
            get_template("random")
            self.assertTrue("Unknown template random" in str(context.exception))

    def test_known_template_lowercase(self):
        pwd_reset_tpl = get_template("password_reset_link")
        self.assertTrue(isinstance(pwd_reset_tpl, PasswordResetLink))

    def test_known_template_mixedcase(self):
        pwd_reset_tpl = get_template("PASSWORD_reset_link")
        self.assertTrue(isinstance(pwd_reset_tpl, PasswordResetLink))
