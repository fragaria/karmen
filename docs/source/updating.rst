.. _updating:

############################################
Updating
############################################

.. toctree::
  :maxdepth: 2

Every software needs to be updated over time to get new functionality or just 
to fix some bugs. Because Karmen is distributed as a bunch of Docker images,
updating is quite easy.

Finding out about the release
-----------------------------

All new releases show up in `the releases section <https://github.com/fragaria/karmen/releases>`_
on our GitHub. You can get notifications if you start watching the repository or you can subscribe
to an `Atom feed <https://github.com/fragaria/karmen/releases.atom>`_. It will also probably be
announced on our `twitter <https://twitter.com/karmen3d>`_.

The easy way
------------

We have prepared an update script that can perform all of the steps for you. **However, it doesn't hurt
to always have a manual backup before running an automated update.**

If you followed the :ref:`installation <installation>` guide, you will have a ``karmen`` directory
in Raspberry Pi's home directory of ``/home/pi``. And there should be an ``update.sh`` file. It does all
the steps described below for you and after running it, you should be ready to start Karmen again from a new version
either by restarting your device (if you have set up the startup script), or by running 

.. code-block:: sh

   BASE_HOST=<public-ip-address> ./run-karmen.sh


Updating manually
-----------------

All of the following commands are run from the ``/home/pi/karmen`` directory unless stated otherwise.

1. Stop Karmen with ``docker-compose stop``.
2. Do a backup of the whole ``karmen`` directory. This will require sudo access for the database datafiles (this will change in the future).
3. Get the latest ``release.zip`` and unpack its contents into the ``karmen`` directory.
4. Run ``docker-compose pull`` to get the latest versions of docker containers.
5. Start Karmen again with

.. code-block:: sh

   BASE_HOST=<public-ip-address> ./run-karmen.sh
