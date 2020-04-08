import unittest

from server.database import props_storage


class GetUser(unittest.TestCase):
    def test_unsaved_Storage(self):
        p = props_storage.get_props("testpro")
        self.assertEqual(p, None)

    def test_save_json(self):
        data = {"some variable": 123456, "maybe array": [1, 6, 5, 8, 4, 1, 6, 58], "and some other": {"Stuff": "stuff"}}
        props_storage.set_props("prop", data)
        p = props_storage.get_props("prop")
        self.assertEqual(p, data)

    def test_delete(self):
        propName = "deletedProp"
        data = [1, 2, 3]
        p = props_storage.get_props(propName)
        self.assertEqual(p, None)
        props_storage.set_props(propName, data)

        p = props_storage.get_props(propName)
        self.assertEqual(p, data)
        props_storage.delete_props(propName)

        p = props_storage.get_props(propName)
        self.assertEqual(p, None)
