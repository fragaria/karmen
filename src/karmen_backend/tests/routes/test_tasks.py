import unittest
import mock

from server import app
from ..utils import TOKEN_ADMIN, TOKEN_ADMIN_CSRF, TOKEN_USER, TOKEN_USER_CSRF


class TasksRoute(unittest.TestCase):
    def test_set_bad_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/tasks",
                json={"some": "data"},
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)
            response = c.post(
                "/tasks",
                json={"task": "unknown"},
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 400)

    def test_set_no_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post("/tasks", json={"task": "scan_network"})
            self.assertEqual(response.status_code, 401)

    def test_set_no_data(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post("/tasks", headers={"x-csrf-token": TOKEN_ADMIN_CSRF})
            self.assertEqual(response.status_code, 400)

    @mock.patch("server.routes.tasks.scan_network.delay", return_value=None)
    def test_set_data(self, mock_delay):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/tasks",
                json={"task": "scan_network"},
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(response.status_code, 202)
            self.assertEqual(mock_delay.call_count, 1)

    def test_set_user_token(self):
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_USER)
            response = c.post(
                "/tasks",
                json={"task": "scan_network"},
                headers={"x-csrf-token": TOKEN_USER_CSRF},
            )
            self.assertEqual(response.status_code, 401)

    @mock.patch("server.routes.tasks.scan_network.delay")
    def test_no_redis(self, mocked_delay):
        mocked_delay.side_effect = Exception("Redis does not work")
        with app.test_client() as c:
            c.set_cookie("localhost", "access_token_cookie", TOKEN_ADMIN)
            response = c.post(
                "/tasks",
                json={"task": "scan_network"},
                headers={"x-csrf-token": TOKEN_ADMIN_CSRF},
            )
            self.assertEqual(mocked_delay.call_count, 1)
            self.assertEqual(response.status_code, 500)
