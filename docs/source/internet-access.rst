.. _internet-access:

############################################
Internet access
############################################

.. toctree::
  :maxdepth: 2

Karmen Hub is successfully running in your environment, but to make the whole system
really useful, there is still one thing missing: The ability to manage your printers
from anywhere in the world.

There are multiple ways of doing that, take the following list as an inspiration on
how it can be done.

Karmen Cloud
------------

To most straitforward solution is to get our Karmen Pill and register into our cloud
service that launches in 2020. See our `product page <https://karmen.tech>`_ for more
information.

Deployment accessible from the internet
---------------------------------------

This is the obvious choice. You can run Karmen Hub on a server accessible from the internet.
But you have to have your Octoprint's accessible over the internet as well. Don't forget
to protect all of your services that are publicly accessible with passwords and TLS.

Websocket proxy
---------------
You can use our `websocket-proxy <https://github.com/fragaria/websocket-proxy>`_ that is supported
in Karmen Hub out of the box with ``KARMEN_SOCKET_API_URL`` and ``KARMEN_CLOUD_MODE`` options. It
requires a client running next to your Octoprint and a server running in a location accessible by
Karmen Hub. The communication is secured and encrypted.

Port mapping on a router
--------------------------------
If you have your service set up behind a router with a fixed public IP address,
you can use the `port mapping (or port forwarding) <https://en.wikipedia.org/wiki/Port_forwarding>`_
technique.

Just pick a port number and set up a `route on your router <https://portforward.com/router.htm>`_
that maps an outgoing port to the internal device's address.

An example: Your public IP is ``1.2.3.4``, Karmen is running locally on ``192.168.3.89`` and you pick
an external port ``44444``. After setting things up properly, Karmen will be available on ``1.2.3.4:44444``.

All traffic including the webcam streams is now routed to the internet through this mapped port.

This solution is not really safe since the traffic is not encrypted. You should protect the outgoing
service with a TLS certificate.

Virtual Private Network (VPN)
-----------------------------

Some routers offer a simple way of creating a VPN, basically a tunnel that makes your local
network accessible via a secured connection from anywhere in the world. This solution is better
than simple port mapping, because it uses an encrypted communication channel by definition.

If your router does not support a VPN, you can get away with other solutions, such as
`PiVPN <http://www.pivpn.io/>`_. A VPN also makes all of your printers available directly,
so the webcam streams might be a little smoother.

SSH tunneling
---------------

If you have no control over the network element that provides the internet access or you
cannot simply run or get a VPN, `SSH tunneling <https://www.ssh.com/ssh/tunneling/>`_
is yet another option that can be used.

In short, you open an SSH tunnel from the computer that is running the service to a computer
that is visible from the internet. A part of that tunnel is again a port mapping. So let's
say that Karmen Hub is running on ``192.168.3.89:80`` and your internet-visible computer is ``1.2.3.4``.

.. code-block:: sh
  
   ssh -R 8888:localhost:80 1.2.3.4

By running that command, you are routing Karmen Hub's local port 80 to ``1.2.3.4:8888``. So anybody that
can access ``1.2.3.4:8888`` can now access Karmen Hub. In this situation, the traffic between ``1.2.3.4``
and Karmen Hub is encrypted. The traffic between the end user and ``1.2.3.4`` is not, unless the public
facing computer is configured to use a TLS certificate.

Online tunneling services
---------------------------

There are some online services such as `ngrok <https://ngrok.com/>`_ that can establish a publicly
accessible tunnel to your computer. These are usually great for a temporary or testing setup,
but for a permanent solution, other approaches are usually better.

