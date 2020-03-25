.. _printing:

############################################
Printing
############################################

.. toctree::
  :maxdepth: 2
  :hidden:

Are you used to sending your G-Codes into your printer directly from your slicer of choice
like `PrusaSlicer <https://www.prusa3d.com/prusaslicer/>`_,
`Slic3r <https://slic3r.org/>`_ or `the appropriate Cura plugin <https://ultimaker.com/software/ultimaker-cura>`_?
You can use your slicer with Karmen as well, as long as your slicer can integrate with
`Octoprint <https://octoprint.org>`_.

Karmen Hub is partially mimicking Octoprint's API that the slicers are calling. By setting up the address
of the printer in the slicer to ``http://<karmen IP address>/api/octoprint-emulator``,
you can send your G-Codes directly to Karmen Hub that is emulating Octoprint. You might need to experiment
with omitting the `http://` part or adding a `/` to the end of the address. Every slicer might
accept a slightly different format.


In Karmen Hub you can then easily choose on which printer it should get printed.

Instead of the App key that you would copy over from Octoprint, you should create Karmen
API token that can be safely stored in the Slicer's configuration. Remember that Karmen Hub
API tokens are always  scoped to a certain organization, so your G-Code will be available only there.

Since Karmen Hub at this time has no knowledge of the printer's properties (such as filament
material or a heatbed size), the G-Codes cannot be sent to a printer right away and you
have to always go to Karmen to start the print manually.
