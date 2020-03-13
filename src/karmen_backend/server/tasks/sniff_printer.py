import uuid as guid

from server import app, celery
from server.database import printers, network_clients
from server import clients


def save_printer_data(**kwargs):
    if not kwargs["client_props"]["connected"]:
        app.logger.info(
            "Printer on %s is not responding as connected" % kwargs.get("ip")
        )
        return
    existing_network_client = network_clients.get_network_client_by_props(
        kwargs.get("hostname"),
        kwargs.get("ip"),
        kwargs.get("port"),
        kwargs.get("path"),
    )
    if existing_network_client is not None:
        existing_printer = printers.get_printer_by_network_client_uuid(
            kwargs.get("organization_uuid"), existing_network_client.get("uuid")
        )
        if existing_printer:
            app.logger.info(
                "Printer on %s is already registered in %s"
                % (kwargs.get("ip"), kwargs.get("organization_uuid"))
            )
            return
        network_client_uuid = existing_network_client.get("network_client_uuid")
    else:
        network_clients.add_network_client(
            uuid=kwargs.get("network_client_uuid"),
            client=kwargs.get("client"),
            ip=kwargs.get("ip"),
            hostname=kwargs.get("hostname"),
            port=kwargs.get("port"),
            path=kwargs.get("path"),
            token=kwargs.get("token"),
        )
        network_client_uuid = kwargs.get("network_client_uuid")

    printers.add_printer(
        **{
            "uuid": kwargs.get("uuid"),
            "network_client_uuid": network_client_uuid,
            "organization_uuid": kwargs.get("organization_uuid"),
            "name": kwargs.get("name"),
            "client_props": kwargs.get("client_props"),
            "printer_props": kwargs.get("printer_props"),
        }
    )


@celery.task(name="sniff_printer")
def sniff_printer(org_uuid, hostname, ip):
    app.logger.info("Sniffing printer on %s (%s) - trying http" % (ip, hostname))
    printer = clients.get_printer_instance(
        {
            "uuid": guid.uuid4(),
            "network_client_uuid": guid.uuid4(),  # this one might be overwritten later
            "organization_uuid": org_uuid,
            "hostname": hostname,
            "ip": ip,
            "client": "octoprint",  # TODO not only octoprint
            "protocol": "http",
        }
    )

    printer.sniff()
    # Let's try a secured connection
    if not printer.client_info.connected:
        printer.protocol = "https"
        printer.update_network_base()
        app.logger.info("Sniffing printer on %s (%s) - trying https" % (ip, hostname))
        printer.sniff()

    # Not even on https, no reason to do anything
    if not printer.client_info.connected:
        app.logger.info("Sniffing printer on %s (%s) - no luck" % (ip, hostname))
        return

    app.logger.info("Sniffing printer on %s (%s) - success" % (ip, hostname))
    save_printer_data(
        uuid=printer.uuid,
        network_client_uuid=printer.network_client_uuid,
        organization_uuid=org_uuid,
        name=hostname or ip,
        client=printer.client_name(),
        protocol=printer.protocol,
        ip=ip,
        hostname=hostname,
        port=80 if printer.protocol == "http" else 443,
        path="",
        token=None,
        client_props={
            "version": printer.client_info.version,
            "connected": printer.client_info.connected,
            "access_level": printer.client_info.access_level,
            "api_key": printer.client_info.api_key,
            "webcam": printer.client_info.webcam,
            "plugins": printer.client_info.plugins,
        },
        printer_props=printer.get_printer_props(),
    )
