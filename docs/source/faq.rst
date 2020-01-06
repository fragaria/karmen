.. _faq:

############################################
F.A.Q.
############################################

.. toctree::
  :maxdepth: 1
  :hidden:

How does the network scanning work?
--------------------------------------

The optional discovery mode is `scanning <https://linux.die.net/man/1/arp-scan>`_
a configured network interface for all devices and tries to call the common HTTP(S) ports to discover
a known 3D printer service such as Octoprint. If it finds one, it adds it
automatically to Karmen.

How can I add a password protected Octoprint?
-----------------------------------------------

Octoprint's protected instances can be communicated with by using an
`API key <http://docs.octoprint.org/en/master/api/general.html#authorization>`_
that you can add to each printer on its settings screen.