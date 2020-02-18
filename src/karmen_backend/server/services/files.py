import os
import re
from time import time
from werkzeug.utils import secure_filename

from server import app


def save(org_uuid, incoming, path):
    original_filename = incoming.filename
    filename = secure_filename(original_filename)
    destination_dir = os.path.join(app.config["UPLOAD_FOLDER"], org_uuid, path)
    destination = os.path.join(destination_dir, filename)

    # fix potentially non-existent paths
    os.makedirs(destination_dir, exist_ok=True)
    # name duplicities
    if os.path.exists(destination):
        original_filename = re.sub(
            r"(\..+)", r"-" + re.escape(repr(round(time()))) + r"\1", incoming.filename
        )
        filename = secure_filename(original_filename)
        destination = os.path.join(destination_dir, filename)
    incoming.save(destination)
    size = os.stat(destination).st_size
    return {
        "path": path,
        "filename": filename,
        "display": original_filename,
        "absolute_path": destination,
        "size": size,
    }


def remove(absolute_path):
    os.remove(absolute_path)
