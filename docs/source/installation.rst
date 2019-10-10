.. _installation:

############################################
Installation
############################################

.. toctree::
  :maxdepth: 2

.. note::
  There might be other viable solutions, but at the moment, Karmen supports only
  Octoprint.

Making your printer Karmen-ready
--------------------------------

The de-facto standard for making your 3D printer accessible over the network
is `Octoprint <https://octoprint.org>`_. Its installation can be greatly
simplified by using a Raspbian-derived image with a pre-configured installation
called `OctoPi <https://github.com/guysoft/OctoPi>`_ that is designed for Raspberry Pi
microcomputers.

After the initial Octoprint/OctoPi setup that connects your printer is performed,
you are ready to connect the printer to Karmen. Please note, that any issues you
might have with a webcam stream or other specifics, are related to Octoprint/OctoPi
and not to Karmen. *Karmen is only using Octoprint's API to communicate with the
printer.*

Also, make sure that the Octoprint instance is accessible over the same network
on which Karmen will be running.

.. warning::
  Karmen currently does not support the secured Octoprint installations, it relies
  on the publicly available API. We are working on it. Do not expose your unsecured
  printer or Karmen to the internet.

Installing Karmen
-----------------

Karmen should run on any Linux-based distribution running on ``amd64`` or ``arm/v7`` architecture.
We recommend to use a standalone computer for it, namely a `Raspberry Pi 4 <https://www.raspberrypi.org>`_ is a great fit.
The only dependency Karmen requires is `Docker <https://www.docker.com>`_ that can be easily installed on Raspberry Pi by
running a few commands adapted from this `official blogpost <https://blog.docker.com/2019/03/happy-pi-day-docker-raspberry-pi/>`_.
We recommend to use a clean Raspbian image as a base for installing Karmen.

If you use a freshly installed Raspbian image, make sure that you run `sudo apt update && sudo apt upgrade -y && sudo reboot`
before installing docker. That installs the latest version of all of the system packages and performs a restart.

.. code-block:: sh

   sudo apt-get install software-properties-common -y
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   sudo usermod -aG docker pi
   sudo apt install docker-compose
   sudo reboot
   docker info

The last command should spit out a bunch of information about your docker installation.

The next step is to get a production bundle for Karmen. You can get these in the
`Releases section on our GitHub <https://github.com/fragaria/karmen/releases>`_.
Just download the latest one to your Raspberry Pi's home directory and unzip it.

.. code-block:: sh

   cd
   wget -O karmen.zip https://github.com/fragaria/karmen/releases/latest/download/release.zip
   unzip karmen.zip
   cd karmen

The directory ``karmen`` now contains at least the following files:

- ``docker-compose.yml`` - A blueprint for all necessary services
- ``config.local.cfg.sample`` - A sample configuration file that you should edit to your needs
- ``db/schema.sql`` - Initial database schema
- ``run-karmen.sh`` - A startup script you can use to launch karmen
- ``update.sh`` - An update script that can bring your installation up to date
- ``VERSION`` - A file with a version number. Useful for troubleshooting

Firstly, you should copy the ``config.local.cfg.sample`` in ``config.local.cfg`` and edit all the
necessary stuff. You can for example tweak the settings of the network autodiscovery, but you
should **absolutely change the** ``SECRET_KEY`` variable for security reasons.

The database schema is created automatically upon the first start. The datafiles are created on
your filesystem, not inside the container, so no data will be lost during Karmen's downtime.
The database handling might change in the future.

Finally, you can start all of the services. The shorthand script will download and run all of the
containers from `Docker Hub <https://hub.docker.com/search?q=fragaria%2Fkarmen&type=image>`_ for you.

.. code-block:: sh

   BASE_HOST=<public-ip-address> ./run-karmen.sh

``BASE_HOST`` is an address or hostname of the machine where Karmen is running and is used to call
the Python backend from the frontend UI. You will also use it to access the Javascript frontend
from your browser. The frontend is run on standard port 80 and the API is accessible on port 8080.

  .. note::
    Although the Raspbian and OctoPi images support `mDNS <https://en.wikipedia.org/wiki/Multicast_DNS>`_,
    you should set BASE_HOST to the IP address as mDNS might not work on all systems (namely Windows)
    without prior configuration.


You can stop everything by running 

.. code-block:: sh
  
   docker-compose stop


You probably want to start Karmen every time your Raspberry Pi boots up. The easiest way
is to add the following line at the end of your ``/etc/rc.local`` file just before the ``exit 0`` line:

.. code-block:: sh

   cd /home/pi/karmen/ && BASE_HOST=<public-ip-address> ./run-karmen.sh

You should also keep your installation :ref:`up to date <updating>` at all times.

.. note::

   The release also contains an instance of `fragaria/rpi-led-control <https://github.com/fragaria/rpi-led-control>`_
   that is used to control an LED strip attached to the Raspberry Pi. This is just for show, it is not
   needed for a successful run of Karmen.
