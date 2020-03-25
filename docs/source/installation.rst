.. _installation:

############################################
Installation
############################################

.. toctree::
  :maxdepth: 2

Making your printer Karmen-ready
--------------------------------

The easiest way is to get yourself a fully plug'n'play
`Karmen Pill <https://karmen.tech/en/#products>`_.

For hobbyists, the de-facto standard for making your 3D printer accessible over the network
is `Octoprint <https://octoprint.org>`_. Its installation can be greatly
simplified by using a Raspbian-derived image with a pre-configured installation
called `OctoPi <https://github.com/guysoft/OctoPi>`_ that is designed for Raspberry Pi
microcomputers.

.. note::
  There might be other viable solutions, but at the moment, Karmen Hub supports only
  Karmen Pill and Octoprint.

Karmen Hub supports `password-protected Octoprint <http://docs.octoprint.org/en/master/features/accesscontrol.html>`_
instances as well, it is possible to attach an API token to a printer on the printer settings screen (the option is
only available when Octoprint is actually password-protected).

Also, make sure that the Octoprint instance is accessible over the network
from a computer on which Karmen Hub is running.

Installing Karmen Hub
---------------------

Karmen Hub should run on any OS supporting `Docker <https://www.docker.com>`_ running on ``amd64`` or ``arm/v7`` architecture.
We recommend to use a standalone computer for it, namely a `Raspberry Pi 4 <https://www.raspberrypi.org>`_ is a great fit.
Docker can be easily installed on Raspberry Pi by running a few commands adapted from this
`official blogpost <https://blog.docker.com/2019/03/happy-pi-day-docker-raspberry-pi/>`_.
We recommend to use a clean Raspbian image as a base for installing Karmen Hub.

If you use a freshly installed Raspbian image, make sure that you run `sudo apt update && sudo apt upgrade -y && sudo reboot`
before installing docker. That updates the system to the latest version and performs a restart.

.. code-block:: sh

   sudo apt install software-properties-common -y
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   sudo usermod -aG docker pi
   sudo apt install docker-compose -y
   sudo reboot
   docker info

The last command should spit out a bunch of information about your docker installation.

The next step is to get a production bundle for Karmen Hub. You can get these in the
`Releases section on our GitHub <https://github.com/fragaria/karmen/releases>`_.
Just download the latest stable ``release.zip`` to your Raspberry Pi's home directory and unzip it.

.. code-block:: sh

   cd
   wget -O karmen.zip https://github.com/fragaria/karmen/releases/latest/download/release.zip
   unzip karmen.zip
   cd karmen

The directory ``karmen`` now contains at least the following files:

- ``docker-compose.yml`` - A blueprint for all necessary services
- ``run-karmen.sh`` - A startup script you can use to launch karmen
- ``stop-karmen.sh`` - A script you can use to stop karmen
- ``update.sh`` - An update script that can bring your installation up to date
- ``VERSION`` - A file with a version number useful for troubleshooting

The database schema is created automatically upon the first start and is kept up to date during updates.
The datafiles are created on your filesystem, not inside the container, so no data will be lost during
Karmen Hub's downtime.

Karmen Hub requires a little bit of :ref:`configuration <configuration>` that is done exclusively
with environment variables. The only required one is ``KARMEN_SECRET_KEY`` which you should
set to something secret. It is used for session encryption and should be unique for each installation.

Another super important environment variable is ``KARMEN_CLOUD_MODE``. If it is set to ``0``, Hub will
try to work with Pills, Octoprints and printers available directly over the network. If it is set to
``1``, the application presumes that it is running somewhere on the internet and the devices are
connected over a specialized `websocket proxy <https://github.com/fragaria/websocket-proxy>`_ that comes
preconfigured with Karmen Pill. When you are setting ``KARMEN_CLOUD_MODE`` to ``1``, you also need to provide
``KARMEN_SOCKET_API_URL`` variable which points to the websocket proxy instance.

If you want to allow users registration, tou need to configure a mailing service as well. Consult the
:ref:`configuration <configuration>` section for more information.

Finally, you can start all of the services. During the first startup, the script will automatically
download (from `Docker Hub <https://hub.docker.com/search?q=fragaria%2Fkarmen&type=image>`_) and run
all of the necessary containers. This might take a few minutes. For the first and
all other starts, you can use the shorthand script like this:

.. code-block:: sh

   KARMEN_CLOUD_MODE=0 KARMEN_SECRET_KEY=something-secr3t ./run-karmen.sh

The browser-accessible frontend is then accessible on the standard HTTP port 80. Again, consult
the :ref:`configuration <configuration>` page for more configruation options including the used ports.

You can access the UI by accessing the public IP address of your machine, or by accessing the
``<hostname>.local`` address which is automatically provided by Raspbian. The default hostname
for standard Raspbian is ``raspberrypi`` and can be changed from the command line by running the
``raspi-config`` program.

  .. note::
    Raspbian and OctoPi provide the ``<hostname>.local`` service via
    `mDNS <https://en.wikipedia.org/wiki/Multicast_DNS>`_. This technology might not work on some
    clients without prior configuration.


You can stop everything by running 

.. code-block:: sh
  
   ./stop-karmen.sh


You probably want to start Karmen every time your Raspberry Pi boots up. Arguably the easiest (but in no way perfect) method
is to add the following line at the end of your ``/etc/rc.local`` file just before the ``exit 0`` line:

.. code-block:: sh

   KARMEN_CLOUD_MODE=0 KARMEN_SECRET_KEY=something-secr3t /home/pi/karmen/run-karmen.sh >> /home/pi/karmen/startup.log

This will also put all of the startup information into a logfile in case you need to debug a broken start of Karmen.
Be aware that this method starts all of the containers under a ``root`` account, which might not be the best idea.

An alternative might be a `systemd <https://www.linode.com/docs/quick-answers/linux/start-service-at-boot/>`_ service
which might be setup with a file like this:

.. code-block:: sh

  [Unit]
  Description=Karmen
  DefaultDependencies=no
  After=docker.service

  [Service]
  Environment="KARMEN_CLOUD_MODE=0"
  Environment="KARMEN_SECRET_KEY=something-secr3t"
  Environment="KARMEN_HOST=127.0.0.1"
  Environment="KARMEN_PORT=3776"
  User=pi
  Group=users
  ExecStart=/usr/bin/karmen
  RemainAfterExit=yes
  ExecStop=/usr/bin/karmen-stop

  [Install]
  WantedBy=multi-user.target

The ``/usr/bin/`` scripts are just links to the aforementioned ``run-karmen.sh`` and ``stop-karmen.sh`` scripts.

You should also keep your installation :ref:`up to date <updating>` at all times.

After the installation is ready, you can proceed with your :ref:`first run <firstrun>`.
