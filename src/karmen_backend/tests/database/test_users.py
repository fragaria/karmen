import unittest

from server.database.users import get_by_uuid


class GetUser(unittest.TestCase):
    def test_returns_user(self):
        user = get_by_uuid("6480fa7d-ce18-4ae2-818b-f1d200050806")
        self.assertEqual(user["uuid"], "6480fa7d-ce18-4ae2-818b-f1d200050806")
        self.assertEqual(user["username"], "test-admin")

    def test_returns_nothing(self):
        user = get_by_uuid("6480fa7d-ce18-4ae2-1234-f1d200050806")
        self.assertEqual(user, None)
