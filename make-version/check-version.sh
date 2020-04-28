#!/bin/bash
#
# Check that current git tag was written using make-version.py script
#
# USAGE: check-version.sh [--ignore-missing-tag]
#
#    --ignore-missing-tag  ... do not fail when current git hash equals to no named git tag
set -eu 
set -o pipefail

<<<<<<< HEAD
cd "$(dirname "`realpath $0`")"
cd ..

=======
>>>>>>> version checking
files_containing_version="
  src/karmen_frontend/package.json
  src/karmen_frontend/package-lock.json
  src/karmen_backend/server/__init__.py
  src/fakeprinter/fakeprinter/__init__.py
  docs/source/conf.py
"

current_tag=`git describe --exact-match --tags $(git log -n1 --pretty='%h') 2>/dev/null` || true
current_tag=${current_tag#v*}
if [ -z $current_tag ]; then
  if !(echo -- " $@ " | grep -- ' --ignore-missing-tag ' > /dev/null); then
    echo "Could not get tag for this release."
    exit 255
  fi
else
  for filepath in $files_containing_version; do
    if [ ! -z $filepath ]; then
      if ! grep "$current_tag" "$filepath" > /dev/null; then
         echo "Current tag '$current_tag' is not in $filepath. Did you run ./make-version.sh <tag>?"
         exit 1
      fi
    fi
  done
  echo "Current version: $current_tag / git tag v$current_tag"
fi
