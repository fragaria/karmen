.. _installation:

############################################
Installation
############################################

.. toctree::
  :maxdepth: 2

Making your printer Karmen-ready
--------------------------------

The de-facto standard for making your 3D printer accessible over the network
is `Octoprint <https://octoprint.org>`_. Its installation can be greatly
simplified by using a Raspbian-derived image with a pre-configured installation
called `OctoPi <https://github.com/guysoft/OctoPi>`_ that is designed for Raspberry Pi
microcomputers.

.. note::
  There might be other viable solutions, but at the moment, Karmen supports only
  Octoprint.

After the initial Octoprint/OctoPi setup that connects your printer is performed,
you are ready to connect the printer to Karmen. Please note, that any issues you
might have with a webcam stream or other specifics, are related to Octoprint/OctoPi
and not to Karmen. *Karmen is only using Octoprint's API to communicate with the
printer.*

Karmen supports `password-protected Octoprint <http://docs.octoprint.org/en/master/features/accesscontrol.html>`_
instances as well, it is possible to attach an API token to a printer on the printer settings screen (the option is
only available when Octoprint is actually password-protected).

Also, make sure that the Octoprint instance is accessible over the network
from a computer on which Karmen will be running.

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

   sudo apt install software-properties-common -y
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
- ``run-karmen.sh`` - A startup script you can use to launch karmen
- ``update.sh`` - An update script that can bring your installation up to date
- ``VERSION`` - A file with a version number. Useful for troubleshooting

Firstly, you should copy the ``config.local.cfg.sample`` in ``config.local.cfg`` and edit all the
necessary stuff. You can for example tweak the settings of the network discovery, but you
should **absolutely change the** ``SECRET_KEY`` variable for security reasons.

The database schema is created automatically upon the first start and is kept up to date during updates.
The datafiles are created on your filesystem, not inside the container, so no data will be lost during Karmen's downtime.

Finally, you can start all of the services. The shorthand script will download and run all of the
containers from `Docker Hub <https://hub.docker.com/search?q=fragaria%2Fkarmen&type=image>`_ for you.

.. code-block:: sh

   ./run-karmen.sh

The browser-accessible frontend is then run on the standard port 80.

It is possible to modify the port like this:

.. code-block:: sh

   KARMEN_PORT=3776 ./run-karmen.sh

This will run the frontend on port 3776.

You can access the UI by accessing the public IP address of your machine, or by accessing the
``<hostname>.local`` address which is automatically provided by Raspbian.

  .. note::
    Although the Raspbian and OctoPi images provide the ``<hostname>.local`` via
    `mDNS <https://en.wikipedia.org/wiki/Multicast_DNS>`_, it might not work on some systems (namely Windows)
    without prior configuration.


You can stop everything by running 

.. code-block:: sh
  
   docker-compose stop


You probably want to start Karmen every time your Raspberry Pi boots up. The easiest way
is to add the following line at the end of your ``/etc/rc.local`` file just before the ``exit 0`` line:

.. code-block:: sh

   cd /home/pi/karmen && ./run-karmen.sh >> /home/pi/karmen/startup.log

This will also put all of the startup information into a logfile in case you need to debug a broken start of Karmen.
Be aware that this method starts all of the containers under a ``root`` account, which might not be the best idea.

You should also keep your installation :ref:`up to date <updating>` at all times.

After the installation is ready, you can proceed with your :ref:`first run <firstrun>`.

.. note::

   The release also contains an instance of `fragaria/rpi-led-control <https://github.com/fragaria/rpi-led-control>`_
   that is used to control an LED strip attached to the Raspberry Pi. This is just for show, it is not
   needed for a successful run of Karmen.
