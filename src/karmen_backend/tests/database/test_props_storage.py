import unittest

from server.database import props_storage


class PropsStorage(unittest.TestCase):
    def test_unsaved_Storage(self):
        p = props_storage.get_props("test_nonexisting_prop")
        self.assertEqual(p, None)

    def test_save_props(self):
        mock_data = {
            "here we just make up some data": "so we can later check they survived",
            "it would be really bad if this array": [1, 2, 3, 4, 5, 6],
            "20": "changed during the storing",
            "and some other": {
                "Stuff": ["stuff", "eptstein didn't killed himself", "stuff"]
            },
        }
        props_storage.set_props("prop", mock_data)
        p = props_storage.get_props("prop")
        print(p)
        print(mock_data)

        self.assertEqual(p, mock_data)

    def test_delete(self):
        prop_name = "deletedProp"
        data = [1, 2, 3]
        p = props_storage.get_props(prop_name)
        self.assertEqual(p, None)
        props_storage.set_props(prop_name, data)

        p = props_storage.get_props(prop_name)
        self.assertEqual(p, data)
        props_storage.delete_props(prop_name)

        p = props_storage.get_props(prop_name)
        self.assertEqual(p, None)
