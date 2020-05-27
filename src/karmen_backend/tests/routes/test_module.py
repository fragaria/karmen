import unittest

from server import app
import openapi_spec_validator
import yaml


class IndexRoute(unittest.TestCase):
    def test_response(self):
        with app.test_client() as c:
            response = c.get("/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json["app"], "karmen_backend")

    def test_openapi_endpoint(self):
        with app.test_client() as c:
            response = c.get("/openapi-spec.yaml")
            self.assertEqual(response.status_code, 200)
            self.assertIn(b"title: 'Karmen API'", response.data)
            specs = yaml.safe_load(str(response.data, "utf8"))
            openapi_spec_validator.validate_v3_spec(specs)
