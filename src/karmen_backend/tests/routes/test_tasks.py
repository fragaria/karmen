import os
import io
import unittest
import mock

from server import app


class CreateRoute(unittest.TestCase):
    @mock.patch("server.routes.tasks.scan_network.delay")
    def test_enqueue_existing_task(self, mocked_delay):
        with app.test_client() as c:
            response = c.post("/tasks", json={"task": "scan_network"})
            self.assertEqual(response.status_code, 202)
            self.assertEqual(mocked_delay.call_count, 1)

    @mock.patch("server.routes.tasks.scan_network.delay")
    def test_enqueue_unknown_task(self, mocked_delay):
        with app.test_client() as c:
            response = c.post("/tasks", json={"task": "unknown_task"})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(mocked_delay.call_count, 0)

    @mock.patch("server.routes.tasks.scan_network.delay")
    def test_no_task(self, mocked_delay):
        with app.test_client() as c:
            response = c.post("/tasks")
            self.assertEqual(response.status_code, 400)
            self.assertEqual(mocked_delay.call_count, 0)

    @mock.patch("server.routes.tasks.scan_network.delay")
    def test_no_redis(self, mocked_delay):
        mocked_delay.side_effect = Exception("Redis does not work")
        with app.test_client() as c:
            response = c.post("/tasks", json={"task": "scan_network"})
            self.assertEqual(mocked_delay.call_count, 1)
            self.assertEqual(response.status_code, 500)
