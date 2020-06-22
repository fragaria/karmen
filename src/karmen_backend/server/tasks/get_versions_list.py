from server import app, celery
import requests
import re
from server.database import props_storage


@celery.task(name="get_versions_list")
def get_versions_list():
    UPDATES_URL = "https://pill-updates.karmen.tech/updates-list.txt"
    # not expected to change, as this will have to stay to support older clients
    r = requests.get(UPDATES_URL)
    if r and r.status_code == 200:
        versions = []
        for line in r.text.split("\n"):
            line = line.strip()
            if not line:
                continue
            if line.startswith("#"):
                continue
            if line.count("::") != 2:
                continue

            [pattern, new_version_name, new_url] = [
                part.strip() for part in line.split("::", 2)
            ]
            versions.append(
                {"pattern": pattern, "new_version_name": new_version_name,}
            )
        props_storage.set_props("versions", versions)
    else:
        app.logger.error("Unable to fetch updates")
