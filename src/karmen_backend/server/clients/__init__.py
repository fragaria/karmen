from server.clients.cachedoctoprint import CachedOctoprint


def get_printer_instance(printer):
    if printer is None or not "client" in printer:
        raise RuntimeError("Printer has no client defined")
    if printer["client"] == "octoprint":
        return CachedOctoprint(**printer)

    raise RuntimeError("Printer has an unknown client %s defined" % printer["client"])
