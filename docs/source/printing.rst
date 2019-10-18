.. _printing:

############################################
Printing
############################################

.. toctree::
  :maxdepth: 2
  :hidden:

Are you used to sending your G-Codes in your printer directly from your slicer of choice
like `PrusaSlicer <https://www.prusa3d.com/prusaslicer/>`_,
`Slic3r <https://slic3r.org/>`_ or `the appropriate Cura plugin <https://ultimaker.com/software/ultimaker-cura>`_?
You can use your slicer with Karmen as well, as long as your slicer can integrate with
`Octoprint <https://octoprint.org>`_.

Karmen is partially mimicking Octoprint's API that the slicers are calling. By setting up the address
of the printer in the slicer to something like ``http://<karmen IP address>:<karmen API port>/octoprint-emulator``,
you can send your G-Codes directly to Karmen that is emulating Octoprint. 
In Karmen you can then easily choose on which printer it should get printed.

.. warning::
  Karmen currently does not support the Octoprint security layer, so it might not work
  if the slicer requires that.

Since Karmen at this time has no knowledge of the printer's properties (such as filament
material or a heatbed size), the G-Codes cannot be sent to a printer right away and you
have to always go to Karmen to start the print manually.
