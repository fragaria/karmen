from server.drivers.octoprint import Octoprint


def get_printer_instance(printer):
    if not "client" in printer:
        raise RuntimeError("Printer has no client defined")
    if printer["client"] == "octoprint":
        return Octoprint(**printer)

    raise RuntimeError("Printer has an unknown client %s defined" % printer["client"])
