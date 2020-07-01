import unittest

from server.services.validators import is_email


class DoArpScanTest(unittest.TestCase):
    def test_bad_email(self):
        self.assertFalse(is_email("not an email")[0])

    def test_no_email(self):
        self.assertFalse(is_email("")[0])

    def test_email(self):
        self.assertTrue(is_email("test@example.com")[0])
