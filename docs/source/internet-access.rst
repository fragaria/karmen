.. _internet-access:

############################################
Internet access
############################################

.. toctree::
  :maxdepth: 2

Karmen is successfully running in your environment, but to make the whole system
really useful, there is still one thing missing: The ability to manage your printers
from anywhere in the world.

There are multiple ways of doing that, take the following list as an inspiration on
how it can be done.


Port mapping on a router
--------------------------------
If you have Karmen and your printers set up behind a router with a fixed public IP address,
you can use the `port mapping (or port forwarding) <https://en.wikipedia.org/wiki/Port_forwarding>`_
technique.

Just pick a port number and set up a `route on your router <https://portforward.com/router.htm>`_
that maps an outgoing port to the internal Karmen address.

An example: Your public IP is ``1.2.3.4``, Karmen is running locally on ``192.168.3.89`` and you pick
an external port ``44444``. After setting things up properly, Karmen will be available on ``1.2.3.4:44444``.

All traffic including the webcam streams is now routed to the internet through this mapped port.

This solution is not really safe since the traffic is not encrypted. There will be a guide
on how to secure the Karmen server with a TLS certificate eventually.

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

In short, you open an SSH tunnel from the computer that is running Karmen to a computer
that is visible from the internet. A part of that tunnel is again a port mapping. So let's
say that Karmen is running on ``192.168.3.89:80`` and your internet-visible computer is ``1.2.3.4``.

.. code-block:: sh
  
   ssh -R 8888:localhost:80 1.2.3.4

By running that command, you are routing Karmen's local port 80 to ``1.2.3.4:8888``. So anybody that
can access ``1.2.3.4:8888`` can now access Karmen. In this situation, the traffic between ``1.2.3.4``
and Karmen is encrypted. The traffic between the end user and ``1.2.3.4`` is not, unless the public
facing computer is configured to use some kind of encrypted traffic.

Online tunneling services
---------------------------

There are some online services such as `ngrok <https://ngrok.com/>`_ that can establish a publicly
accessible tunnel to your computer. These are usually great for a temporary or testing setup,
but for a permanent solution, other approaches are usually better.

