import unittest

from server import app

class IndexRoute(unittest.TestCase):
    def test_response(self):
        with app.test_client() as c:
            response = c.get('/')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json["app"], "karmen_backend")
