from server import app, celery
import requests
from server.database import props_storage


@celery.task(name="get_versions_list")
def get_versions_list():
    UPDATES_URL = "https://karmen-updates.f1.f-app.it/pill/updates/updates.txt"
    # not expected to change, as this will have to stay to support older clients
    print(props_storage.get_props("versions"))
    r = requests.get(UPDATES_URL)
    print("we just got request", r, r.status_code, r.text)
    if r and r.status_code == 200:
        versions = []
        print("here we should get some reply tet which is", r.text)
        for line in r.text.split("\n"):
            if line.startswith("#"):
                continue
            version = line.split("\t")[0]
            if version:
                versions.append(version)
        props_storage.set_props("versions", versions)
    else:
        app.logger.error("Unable to fetch updates")
