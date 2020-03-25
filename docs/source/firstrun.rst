.. _firstrun:

############################################
First run
############################################

.. toctree::
  :maxdepth: 2

So you have :ref:`installed <installation>` Karmen, launched the UI in your browser and
all you can see is a login form. What next?

User access model
-----------------

Like almost any other software out there, Karmen has a concept of users built-in.
Without a valid user session, you are not able to do anything with Karmen.

Users are grouped into organizations. In each organization, users can have one of the
two roles in Karmen Hub:

- *Administrators*
- *Users*

Administrators can manage printers and users. Common users can use all of the printers and
access the shared gcode library.

Upon installation, there is an administrator account ready with username **karmen** and
password *karmen3D* for you. The application will prompt you to change the password upon
the first login. So make sure that you log in right after the installation is complete
so nobody else can hijack the installation from you.

There is also a Default organization ready for you. You can rename it at any time. As an
administrator, you can invite more users to your organization. That requires a working mailing
service.

Also, for some operations, such as another password change or adding users, you need to 
re-authenticate with your password from time to time. So don't be alarmed if the application
prompts for your password again.

Handsfree access
----------------

Sometimes, you need to access the application automatically - for example to run a monitoring
dashboard or to access the API programatically. For that, Karmen offers API tokens tied to
a certain user account and organization. Everyone can create as many tokens as they want. The API tokens
have the following properties:

- They never expire.
- They are always in the *user* role, so you cannot use them for adding printers for example.
- They are bound to a single organization.
- They can be revoked from the application.

You can work with your API tokens after clicking your username in the app.

For the monitoring dashboard use case, you can run the UI in your browser directly with the token
like this:

.. code-block:: sh

   http://<karmen-hub-address>/?token=<my-api-token>

.. note::
  The tokens are signed by the application and if you change the ``KARMEN_SECRET_KEY`` value in your
  configuration, they will stop working altogether.

If you need to automate some administrative tasks, you should be successful if you copy your active
session token (after you are prompted for password) from a browser's session cookies. Such token
will expire in a few minutes, though, so you have to be quick.
