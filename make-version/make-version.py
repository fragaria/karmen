#!/usr/bin/env python3
import sys
import os
import re
import json



def update_json(version, pathname):
    with open(pathname, 'r+') as fp:
        data = json.load(fp)
        data['version'] = version
        fp.seek(0)
        fp.truncate()
        json.dump(data, fp, indent=2)

def update_py(version, pathname):
    with open(pathname, 'r+') as fp:
        data = fp.read()
        data = re.sub(r'^(__version__\s*=\s*)(\'|").+(\2)', r'\1"%s"' % version, data, 0, re.MULTILINE)
        fp.seek(0)
        fp.truncate()
        fp.write(data)

if __name__ == '__main__':
    from pathlib import Path
    script_path = Path(__file__).parent.absolute()
    project_root = script_path.parent.absolute()
    if len(sys.argv) != 2:
        print('Usage: python make-version.py 1.2.3')
        sys.exit(1)
    version = sys.argv[1]
    print("Updating to version '%s'." % version)
    with script_path.joinpath('./files-to-update').open() as file_list:
        files_to_update = [p.strip() for p in file_list.readlines()]
    for filepath in files_to_update:
        print('... %s' % filepath)
        if filepath.endswith('.py'):
            update_py(version, project_root.joinpath(filepath))
        elif filepath.endswith('.json'):
            update_json(version, project_root.joinpath(filepath))
        else:
            raise ValueError("Invalid file extension '%s'." % filepath)
    print('''Done.

    Don't forget to:

    git commit %(files)s -m 'version raised to %(version)s'
    git tag v%(version)s
    ''' % {
        'version':version,
        'files': '\\\n        '.join(files_to_update),
        })
