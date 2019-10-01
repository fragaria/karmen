############################################
Installation
############################################

.. toctree::
  :maxdepth: 2

Making your printer Karmen-ready
--------------------------------

.. note::
  There might be other viable solutions, but at the moment, Karmen supports only
  Octoprint.

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
  printer to the internet.

Installing Karmen
-----------------

Karmen should run on any Linux-based distribution, and we recommend to use a standalone
computer for it. A Raspberry Pi is again a good fit. The only dependency Karmen requires
is `Docker <https://www.docker.com>`_ that can be easily installed on Raspberry Pi by running the
following commands adapted from this `blogpost <https://blog.docker.com/2019/03/happy-pi-day-docker-raspberry-pi/>`_.
We recommend to use a clean Raspbian image for installing Karmen.

.. code-block:: sh

   sudo apt-get install software-properties-common -y
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   sudo usermod -aG docker pi
   sudo apt install docker-compose
   sudo reboot
   docker info

The last command should spit out a bunch information about your docker installation.

The next step is to get a production bundle for Karmen. You can get these in the
`Releases section on our GitHub <https://github.com/fragaria/karmen/releases>`_.
Just download the latest one to your Raspberry Pi's home directory and unzip it.

.. code-block:: sh

   cd
   wget -O karmen.zip https://github.com/fragaria/karmen/releases/latest/download/release.zip
   unzip karmen.zip
   cd karmen

It contains the following files:

- ``docker-compose.yml`` - A bluperint for all necessary services
- ``config.local.cfg`` - Configuration file that you should edit to your needs
- ``db/schema.sql`` - Initial database schema
- ``run-karmen.sh`` - A startup script you can use to launch karmen

Firstly, you should edit all the necessary stuff in ``config.local.cfg``. You can tweak 
the settings of the network autodiscovery, but you should **absolutely change the** ``SECRET_KEY``
variable for security reasons.

The ``db/schema.sql`` file is run automatically only upon the first start. The database handling might
change in the future. The datafiles are created on your filesystem, not inside the containers,
so no data will be lost during karmen's downtime.

Finally, you can start all of the services. The shorthand script will download and run all of the containers for you.

.. code-block:: sh

   BASE_HOST=public-ip-address ./run-karmen.sh

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


Permanent installation
----------------------

You probably want to start karmen every time you boot your Raspberry Pi. The easiest way
is to add the following line at the end of your ``/etc/rc.local`` file:

.. code-block:: sh

   BASE_HOST=public-ip-address /home/pi/karmen/run-karmen.sh

Upgrading
---------

If a new Karmen release gets out, you can upgrade by downloading the new release bundle from GitHub and
overwriting your existing files in ``karmen`` directory. If you then run the ``run-karmen.sh`` script
again, it will download the updated images and run the newer version of the whole system.