.. _overview:

############################################
Overview
############################################

.. toctree::
  :maxdepth: 2
  :hidden:

First, there was a 3D printer. Then, there was a network connected 3D printer
with a controlling software like `Octoprint <https://octoprint.org>`_,
`Astroprint <https://www.astroprint.com/>`_ or `Repetier <https://www.repetier.com/>`_.

The next obvious step is a service that can talk to multiple network connected
3D printers. And although there are services that aspire to do such job, there does
not seem to be an open source version that you could run as a self hosted, on-premise
software.

So how does Karmen work?

The control hub
-----------------------

This is the main part of Karmen consisting of a `backend service <https://github.com/fragaria/karmen/tree/master/src/karmen_backend>`_
in Python and a `light frontend client <https://github.com/fragaria/karmen/tree/master/src/karmen_frontend>`_
in Javascript accessible from a browser.

The backend essentially works as a proxy for any configured and connected printer that
can talk in one of the supported dialects.

To add a new printer, you just tell Karmen the IP address of that printer
and that's it. Everything else is done automatically.

The printers
------------

Any 3D printer that uses a supported software connector can be added to the system. Right now,
we support only *Octoprint*, but more will come in the future. It is, of course, required
for the two devices to see each other on the network. You have essentially two options for
that:

1. Connect everything into an existing network
2. Create an isolated network for the printers and expose the control hub's user interface
   to a commonly accessible network

Any of the two will work, **just make sure that none of the devices are directly accessible
from the internet without proper security.**

