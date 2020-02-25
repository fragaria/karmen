import unittest

from server.services.validators import is_email


class DoArpScanTest(unittest.TestCase):
    def test_bad_email(self):
        self.assertFalse(is_email("not an email"))

    def test_no_email(self):
        self.assertFalse(is_email(""))

    def test_email(self):
        self.assertTrue(is_email("test@example.com"))
