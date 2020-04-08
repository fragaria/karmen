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
                """# version number and file name are separated by one tab
# this is important as the check version script is using split("\t") to break the line into version name and update filename
# also, lines starting with # (without any whitespace before it) are skipped
0.0.1\tsomeupdatesname.sh
# here we just make something that could look like file returned from updates server
0.1.0\tand-filename-updates-are-not-important-as-karmen-doesnt-care-about-them.sh
""",
            )

        mock_get.side_effect = mock_call
        self.assertEqual(
            props_storage.get_props("version"), None
        )  # make sure we start with empty versions
        get_versions_list()
        self.assertEqual(props_storage.get_props("versions"), ["0.0.1", "0.1.0"])
