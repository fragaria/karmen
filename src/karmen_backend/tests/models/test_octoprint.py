import unittest
import json
import mock
import requests

from server.models.octoprint import Octoprint, get_with_fallback

class GetWithFallbackTest(unittest.TestCase):
    @mock.patch('requests.get')
    def test_try_hostname(self, mock_requests):
        get_with_fallback('/api/version', 'host', '1.2.3.4')
        mock_requests.assert_called_with('http://host/api/version', timeout=2)

    @mock.patch('requests.get')
    def test_pass_protocol_timeout(self, mock_requests):
        get_with_fallback('/api/version', None, '1.2.3.4', 'https', 3)
        mock_requests.assert_called_with('https://1.2.3.4/api/version', timeout=3)

    @mock.patch('requests.get')
    def test_try_ip(self, mock_requests):
        get_with_fallback('/api/version', None, '1.2.3.4')
        mock_requests.assert_called_with('http://1.2.3.4/api/version', timeout=2)

    @mock.patch('requests.get')
    def test_add_leading_slash(self, mock_requests):
        get_with_fallback('api/version', None, '1.2.3.4')
        mock_requests.assert_called_with('http://1.2.3.4/api/version', timeout=2)

    @mock.patch('requests.get')
    def test_try_nothing(self, mock_requests):
        request = get_with_fallback('/api/version', None, None)
        self.assertEqual(mock_requests.call_count, 0)
        self.assertEqual(request, None)

    @mock.patch('requests.get')
    def test_fallback_ip(self, mock_requests):
        def mock_call(uri, **kwargs):
            if 'host' in uri:
                raise requests.exceptions.ConnectionError('mocked')
            return uri
        mock_requests.side_effect = mock_call
        request = get_with_fallback('/api/version', 'host', '1.2.3.4')
        self.assertEqual(request, 'http://1.2.3.4/api/version')
        self.assertEqual(mock_requests.call_count, 2)
        mock_requests.assert_has_calls([
            mock.call('http://host/api/version', timeout=2),
            mock.call('http://1.2.3.4/api/version', timeout=2)
        ])

    @mock.patch('requests.get')
    def test_no_success(self, mock_requests):
        def mock_call(uri, **kwargs):
            raise requests.exceptions.ConnectionError('mocked')
        mock_requests.side_effect = mock_call
        request = get_with_fallback('/api/version', 'host', '1.2.3.4')
        self.assertEqual(request, None)
        self.assertEqual(mock_requests.call_count, 2)
        mock_requests.assert_has_calls([
            mock.call('http://host/api/version', timeout=2),
            mock.call('http://1.2.3.4/api/version', timeout=2)
        ])

class OctoprintSniffTest(unittest.TestCase):
    @mock.patch('server.models.octoprint.get_with_fallback', return_value=None)
    def test_deactivate_non_responding_printer(self, mock_get_with_fallback):
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.sniff()
        self.assertEqual(result, {"active": False, "version": {}})

    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_deactivate_non_200_responding_printer(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 400
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.sniff()
        self.assertEqual(result, {"active": False, "version": {}})

    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_deactivate_no_data_responding_printer(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 200
        mock_get_with_fallback.return_value.json.side_effect = json.decoder.JSONDecodeError('msg', 'aa', 123)
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.sniff()
        self.assertEqual(result, {"active": False, "version": {}})

    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_deactivate_bad_data_responding_printer(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 200
        mock_get_with_fallback.return_value.json.return_value = {"text": "Fumbleprint"}
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.sniff()
        self.assertEqual(result, {
            "active": False,
            "version": {"text": "Fumbleprint"}
        })

    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_no_crash_on_different_response(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 200
        mock_get_with_fallback.return_value.json.return_value = {"random": "field"}
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.sniff()
        self.assertEqual(result, {
            "active": False,
            "version": {"random": "field"}
        })

    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_activate_responding_printer(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 200
        mock_get_with_fallback.return_value.json.return_value = {"text": "OctoPrint"}
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.sniff()
        self.assertEqual(result, {
            "active": True,
            "version": {"text": "OctoPrint"}
        })

class OctoprintStatusTest(unittest.TestCase):
    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_status_ok(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 200
        mock_get_with_fallback.return_value.json.return_value = {
            "state": {
                "text": "Printing"
            },
            "temperature": {
                "bed": {
                    "actual": 49.8,
                    "offset": 0,
                    "target": 50.0
                },
                "tool0": {
                    "actual": 240.4,
                    "offset": 0,
                    "target": 240.0
                },
            },
        }
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.status()
        self.assertEqual(result, {
            "status": "Printing",
            "temperature": {
                "bed": {
                    "actual": 49.8,
                    "offset": 0,
                    "target": 50.0
                },
                "tool0": {
                    "actual": 240.4,
                    "offset": 0,
                    "target": 240.0
                },
            },
        })

    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_status_malformed_json(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 200
        mock_get_with_fallback.return_value.json.side_effect = json.decoder.JSONDecodeError('msg', 'aa', 123)
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.status()
        self.assertEqual(result, {
            "status": "Printer is responding with invalid data",
            "temperature": {},
        })

    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_status_conflict(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 409
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.status()
        self.assertEqual(result, {
            "status": "Printer is not connected to Octoprint",
            "temperature": {},
        })

    @mock.patch('server.models.octoprint.get_with_fallback', return_value=None)
    def test_status_unreachable(self, mock_get_with_fallback):
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.status()
        self.assertEqual(result, {
            "status": "Printer is not responding",
            "temperature": {},
        })

class OctoprintWebcamTest(unittest.TestCase):
    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_webcam_no_absolute_url(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 200
        mock_get_with_fallback.return_value.json.return_value = {
            "webcam": {
                "bitrate": "5000k",
                "ffmpegPath": "/usr/bin/ffmpeg",
                "ffmpegThreads": 1,
                "flipH": True,
                "flipV": True,
                "rotate90": False,
                "snapshotSslValidation": True,
                "snapshotTimeout": 5,
                "snapshotUrl": "http://127.0.0.1:8080/?action=snapshot",
                "streamRatio": "4:3",
                "streamTimeout": 5,
                "streamUrl": "/webcam/?action=stream",
                "timelapseEnabled": True,
                "watermark": True,
                "webcamEnabled": True
            }
        }
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.webcam()
        self.assertEqual(result, {
            "stream": "http://192.168.1.15/webcam/?action=stream",
            "flipHorizontal": True,
            "flipVertical": True,
            "rotate90": False,
        })

    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_webcam_absolute_url(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 200
        mock_get_with_fallback.return_value.json.return_value = {
            "webcam": {
                "flipH": True,
                "flipV": True,
                "rotate90": False,
                "streamUrl": "http://1.2.3.4/webcam/?action=stream",
            }
        }
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.webcam()
        self.assertEqual(result, {
            "stream": "http://1.2.3.4/webcam/?action=stream",
            "flipHorizontal": True,
            "flipVertical": True,
            "rotate90": False,
        })

    @mock.patch('server.models.octoprint.get_with_fallback')
    def test_webcam_malformed_json(self, mock_get_with_fallback):
        mock_get_with_fallback.return_value.status_code = 200
        mock_get_with_fallback.return_value.json.side_effect = json.decoder.JSONDecodeError('msg', 'aa', 123)
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.webcam()
        self.assertEqual(result, {})

    @mock.patch('server.models.octoprint.get_with_fallback', return_value=None)
    def test_webcam_no_response(self, mock_get_with_fallback):
        printer = Octoprint('octopi.local', '192.168.1.15', '34:97:f6:3f:f1:96')
        result = printer.webcam()
        self.assertEqual(result, {})
