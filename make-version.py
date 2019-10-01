import sys
import os
import re
import json

if len(sys.argv) < 2:
    print('Usage: python make-version.py 1.2.3')
    sys.exit(1)

DIR_PATH = os.path.dirname(os.path.realpath(__file__))
VERSION = sys.argv[1]

# karmen_frontend
with open(os.path.join(DIR_PATH, "./src/karmen_frontend/package.json"), "r") as packagefile:
    data = json.load(packagefile)
    data["version"] = VERSION
    with open(os.path.join(DIR_PATH, "./src/karmen_frontend/package.json"), "w") as packagefile:
        json.dump(data, packagefile, indent=2, sort_keys=True)

with open(os.path.join(DIR_PATH, "./src/karmen_frontend/package-lock.json"), "r") as packagefile:
    data = json.load(packagefile)
    data["version"] = VERSION
    with open(os.path.join(DIR_PATH, "./src/karmen_frontend/package-lock.json"), "w") as packagefile:
        json.dump(data, packagefile, indent=2, sort_keys=True)


# karmen_backend
with open(os.path.join(DIR_PATH, "./src/karmen_backend/server/__init__.py"), "r") as file:
    output = []
    for line in file:
        if re.match(r'^__version__ = ', line):
            line = '__version__ = "%s"' % (VERSION,)
        output.append(line.rstrip('\n'))
    with open(os.path.join(DIR_PATH, "./src/karmen_backend/server/__init__.py"), "w") as file:
        file.write('\n'.join(output) + '\n')

with open(os.path.join(DIR_PATH, "./src/karmen_backend/fakeprinter/__init__.py"), "r") as file:
    output = []
    for line in file:
        if re.match(r'^__version__ = ', line):
            line = '__version__ = "%s"' % (VERSION,)
        output.append(line.rstrip('\n'))
    with open(os.path.join(DIR_PATH, "./src/karmen_backend/fakeprinter/__init__.py"), "w") as file:
        file.write('\n'.join(output) + '\n')
