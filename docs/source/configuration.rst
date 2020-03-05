.. _configuration:

############################################
Configuration
############################################

.. toctree::
  :maxdepth: 2

If you are running Karmen Hub in the :ref:`recommended way <installation>`, you can adjust
the software's behaviour by plenty of environment variables.

These are interpreted in the ``docker-compose.yml`` file that is part of the release. Be aware
that if you are working with environment variables in the docker containers, the names
might be different, because the variables there are interpreted from within the docker containers
and not from the host machine. For example ``KARMEN_REDIS_HOST`` is accessible as ``REDIS_HOST``
within the container.

Deployment specific options
----------------------------

These should always be setup so your instance works as expected.

.. csv-table::
    :header: Variable name, Default, Description
    :escape: \

    ``KARMEN_SECRET_KEY``, None, "A unique key that is used for session encryption."
    ``KARMEN_FRONTEND_BASE_URL``, None, "Base URL of Karmen Hub frontend. This is used as a base URL in e-mails
    that Karmen Hub is sending ocassionally."
    ``KARMEN_CLOUD_MODE``, 1, "If on, the network scan feature is disabled and printers can be connected only via
    `websocket-proxy <https://github.com/fragaria/websocket-proxy>`_. If off, you can connect to printers via
    ``http`` or ``https``."
    ``KARMEN_SOCKET_API_URL``, None, "Base URL such as ``http://path.to/websocket/api/%s`` where the
    `websocket-proxy <https://github.com/fragaria/websocket-proxy>`_ is accepting connections. USed only when
    ``KARMEN_CLOUD_MODE`` is on. The ``%s`` is replaced by device token during runtime."
    ``KARMEN_MAILER``, dummy, "Type of mailer that is used in the backend to send e-mail. Supported values are
    ``ses``, ``smtp``, ``mailgun`` and ``dummy``. ``Dummy`` mailer is writing to logfile, others are calling an external mail
    sending service. Mailers can be further configured with ``KARMEN_MAILER_CONFIG``."
    ``KARMEN_MAILER_FROM``, Karmen <karmen@karmen.local>, "Default sender of all e-mails."
    ``KARMEN_MAILER_CONFIG``, ``{}``, "JSON with configuration required by the chosen ``KARMEN_MAILER``. The JSON
    should be enclosed in ``'`` or escaped so the shell does not interpret its value.
    
    For ``mailgun``: ``{\"mailgun_domain\": \"...\", \"mailgun_api_key\": \"...\"}``.
    
    For ``ses``: ``{\"aws_secret_key\": \"...\", \"aws_access_key\": \"...\", \"aws_region\": \"...\"}``

    For ``smtp``: ``{\"host\": \"...\", \"port\": \"...\", \"ssl\": \"...\", \"login\": \"...\", \"password\": \"...\"}``
    "

Advanced options
----------------------------

These can help you if your deployment requires some special care.

.. csv-table::
    :header: Variable name, Default, Description
    :escape: \

    ``KARMEN_BACKEND_SENTRY_DSN``, None, "`Sentry <https://sentry.io/>`_ DSN to which the backend will log errors.
    If empty, no logging is happenning."
    ``KARMEN_FRONTEND_SENTRY_DSN``, None, "`Sentry <https://sentry.io/>`_ DSN to which the frontend will log errors.
    If empty, no logging is happenning."
    ``KARMEN_HOST``, 0.0.0.0, "Host interface on which Karmen listens. This is useful when you need to restrict
    access."
    ``KARMEN_PORT``, 80, "Port on which Karmen listens. This is useful if you are running Karmen in an environment
    shared with other services."
    ``KARMEN_UPLOAD_FOLDER``, ./karmen-files, "Location of uploaded files. This directory is mounted as a volume into
    the container."
    ``KARMEN_DB_DIR``, ./db/data, "Location of PostgreSQL datadir."
    ``KARMEN_BACKEND_HOST``, 127.0.0.1, "Host on which the backend API server listens."
    ``KARMEN_BACKEND_PORT``, 9764, "Port on which the backend API server listens."
    ``KARMEN_FRONTEND_HOST``, 127.0.0.1, "Host on which the frontend server listens."
    ``KARMEN_FRONTEND_PORT``, 9765, "Port on which the frontend server listens."
    ``KARMEN_POSTGRES_HOST``, 127.0.0.1, "Host of the `PostgreSQL <https://www.postgresql.org/>`_ database. You
    don't have to use the dockerized instance bundled within the release."
    ``KARMEN_POSTGRES_PORT``, 5433, "Port of the `PostgreSQL <https://www.postgresql.org/>`_ database. You
    don't have to use the dockerized instance bundled within the release."
    ``KARMEN_POSTGRES_DB``, print3d, "Name of the `PostgreSQL <https://www.postgresql.org/>`_ database. This DB is
    created for you during the first run."
    ``KARMEN_POSTGRES_USER``, print3d, "Username for the `PostgreSQL <https://www.postgresql.org/>`_ database. This
    user is created for you during the first run."
    ``KARMEN_POSTGRES_PASSWORD``, print3d, "Password for the `PostgreSQL <https://www.postgresql.org/>`_ database.
    This password is set for the user during the first run."
    ``KARMEN_REDIS_HOST``, 127.0.0.1, "Host of `Redis <https://redis.io/>`_ storage. You don't have to use the
    dockerized instance bundled within the release. We don't support protected instances at the moment, though."
    ``KARMEN_REDIS_PORT``, 6379, "Port of `Redis <https://redis.io/>`_ storage. You don't have to use the dockerized
    instance bundled within the release. We don't support protected instances at the moment, though."
    ``KARMEN_NETWORK_TIMEOUT``, 5, "Timeout for HTTP reads"
    ``KARMEN_VERIFY_CERTIFICATES``, 1, "Whether the app should verify HTTPS certificates. It should and you should
    never change this setting unless you know exactly what you are doing."