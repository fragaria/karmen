from os import path
import unittest
import mock

from server.tasks.analyze_gcode import analyze_gcode


class AnalyzeGcodeTest(unittest.TestCase):
    @mock.patch("server.tasks.analyze_gcode.app.logger.error")
    @mock.patch("server.database.gcodes.get_gcode", return_value=None)
    def test_record_not_found(self, mock_gcode_get, mock_logger):
        analyze_gcode(123)
        self.assertTrue(mock_logger.call_count, 1)
        mock_logger.called_with("Gcode does not exist in database")

    @mock.patch("server.tasks.analyze_gcode.app.logger.error")
    @mock.patch(
        "server.database.gcodes.get_gcode",
        return_value={"absolute_path": "/a/karmen-random-file"},
    )
    def test_file_not_found(self, mock_gcode_get, mock_logger):
        analyze_gcode(123)
        self.assertTrue(mock_logger.call_count, 1)
        mock_logger.called_with("Gcode file not found")

    @mock.patch("server.database.gcodes.set_analysis")
    @mock.patch(
        "server.database.gcodes.get_gcode",
        return_value={
            "absolute_path": path.abspath(
                path.dirname(__file__) + "/../_fixtures/prusaslicer.gcode"
            )
        },
    )
    def test_file_prusaslicer(self, mock_gcode_get, mock_analysis_set):
        print(path.abspath(path.abspath(__file__) + "../_fixtures/prusaslicer.gcode"))
        analyze_gcode(123)
        mock_analysis_set.assert_called_once_with(
            123,
            {
                "slicer": "PrusaSlicer 2.0.0+linux64",
                "filament": {"length_mm": 94.7, "volume_cm3": 0.2, "type": "PLA"},
                "temperatures": {
                    "bed": 60.0,
                    "bed_first": 60.0,
                    "tool0": 215.0,
                    "tool0_first": 215.0,
                },
                "time": {"estimate_s": 193},
            },
        )

    @mock.patch("server.database.gcodes.set_analysis")
    @mock.patch(
        "server.database.gcodes.get_gcode",
        return_value={
            "absolute_path": path.abspath(
                path.dirname(__file__) + "/../_fixtures/cura.gcode"
            )
        },
    )
    def test_file_cura(self, mock_gcode_get, mock_analysis_set):
        analyze_gcode(123)
        mock_analysis_set.assert_called_once_with(
            123,
            {
                "slicer": "Cura_SteamEngine 4.3.0",
                "filament": {"length_mm": 203.432, "volume_cm3": None, "type": None},
                "temperatures": {
                    "bed": None,
                    "bed_first": None,
                    "tool0": None,
                    "tool0_first": None,
                },
                "time": {"estimate_s": 160},
            },
        )

    @mock.patch("server.database.gcodes.set_analysis")
    @mock.patch(
        "server.database.gcodes.get_gcode",
        return_value={
            "absolute_path": path.abspath(
                path.dirname(__file__) + "/../_fixtures/slic3r.gcode"
            )
        },
    )
    def test_file_slic3r(self, mock_gcode_get, mock_analysis_set):
        analyze_gcode(123)
        mock_analysis_set.assert_called_once_with(
            123,
            {
                "slicer": "Slic3r 1.3.0",
                "filament": {"length_mm": 972.9, "volume_cm3": 6.9, "type": None},
                "temperatures": {
                    "bed": 20.0,
                    "bed_first": 30.0,
                    "tool0": 200.0,
                    "tool0_first": 210.0,
                },
                "time": {"estimate_s": None},
            },
        )

    @mock.patch("server.database.gcodes.set_analysis")
    @mock.patch(
        "server.database.gcodes.get_gcode",
        return_value={
            "absolute_path": path.abspath(
                path.dirname(__file__) + "/../_fixtures/simplify3d.gcode"
            )
        },
    )
    def test_file_simplify3d(self, mock_gcode_get, mock_analysis_set):
        analyze_gcode(123)
        mock_analysis_set.assert_called_once_with(
            123,
            {
                "slicer": "Simplify3D(R) Version 4.1.2",
                "filament": {"length_mm": 90037.5, "volume_cm3": 216.57, "type": "PLA"},
                "temperatures": {
                    "bed": None,
                    "bed_first": None,
                    "tool0": None,
                    "tool0_first": None,
                },
                "time": {"estimate_s": 27420},
            },
        )
