#!/bin/bash

DIR=`dirname "$0"`
cd $DIR
DEST="karmen"

rm -r "$DEST" 2> /dev/null
mkdir -p "${DEST}/db"
cp ../README.md "${DEST}"
cp ../docker-compose.release.yml "${DEST}/docker-compose.yml"
cp ../src/karmen_backend/config.release.cfg "${DEST}/config.local.cfg"
cp ../src/karmen_backend/db/schema.sql "${DEST}/db"

cat << EOF > "$DEST/run-karmen.sh"
#!/bin/bash
mkdir -p ./db/data
sudo mkdir -p ./karmen-files
docker-compose stop
docker-compose pull
docker-compose up -d
EOF
chmod +x "${DEST}/run-karmen.sh"
zip -r release.zip "$DEST"