import unittest

from server.database.settings import normalize_val

class NormalizeValTest(unittest.TestCase):
    def test_string_number(self):
        self.assertEqual(normalize_val('1234'), 1234)

    def test_no_touching(self):
        self.assertEqual(normalize_val('ab1234'), 'ab1234')
        self.assertEqual(normalize_val(1400), 1400)

    def test_string_true(self):
        self.assertEqual(normalize_val('1'), True)
        self.assertEqual(normalize_val('yes'), True)
        self.assertEqual(normalize_val('Yes'), True)
        self.assertEqual(normalize_val('true'), True)
        self.assertEqual(normalize_val('True'), True)
        self.assertEqual(normalize_val('on'), True)
        self.assertEqual(normalize_val('On'), True)

    def test_string_false(self):
        self.assertEqual(normalize_val('0'), False)
        self.assertEqual(normalize_val('no'), False)
        self.assertEqual(normalize_val('No'), False)
        self.assertEqual(normalize_val('false'), False)
        self.assertEqual(normalize_val('False'), False)
        self.assertEqual(normalize_val('off'), False)
        self.assertEqual(normalize_val('Off'), False)
