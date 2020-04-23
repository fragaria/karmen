import unittest
import mock
from ..utils import SimpleResponse

from server.tasks.get_versions_list import get_versions_list
from server.database import props_storage


class GetVersionsList(unittest.TestCase):
    @mock.patch("server.tasks.get_versions_list.requests.get")
    def test_get_versions_list(self, mock_get):
        def mock_call(uri, **kwargs):
            return SimpleResponse(
                200,
                r"""# only lines not starting with # AND containing 2x :: are processed
# all 3 parts are stripped for whitespace before processing via python's str.strip()

0\.1\.[123](-alpha)? :: 0.2.0  :: https://karmen-updates.f1.f-app.it/pill/updates/v0.2.0.sh
0\.0\.[12](-alpha)?  :: dev-fake-0.2.0 :: https://karmen-updates.f1.f-app.it/pill/updates/fake-just-for-developing.sh
0\.2\.[01] :: 0.2.2 :: https://karmen-updates.f1.f-app.it/pill/updates/v0.2.2.img

""",
            )

        mock_get.side_effect = mock_call
        self.assertEqual(
            props_storage.get_props("version"), None
        )  # make sure we start with empty versions
        get_versions_list()
        self.assertEqual(
            props_storage.get_props("versions"),
            [
                {"pattern": r"""0\.1\.[123](-alpha)?""", "new_version_name": "0.2.0"},
                {
                    "pattern": r"""0\.0\.[12](-alpha)?""",
                    "new_version_name": "dev-fake-0.2.0",
                },
                {"pattern": r"""0\.2\.[01]""", "new_version_name": "0.2.2"},
            ],
        )
