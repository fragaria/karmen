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

sed -i "s/fragaria\/karmen-frontend/fragaria\/karmen-frontend:${TRAVIS_BRANCH}/g" "${DEST}/docker-compose.yml"
sed -i "s/fragaria\/karmen-backend/fragaria\/karmen-backend:${TRAVIS_BRANCH}/g" "${DEST}/docker-compose.yml"

cat << EOF > "$DEST/run-karmen.sh"
#!/bin/bash
mkdir -p ./db/data
if [ ! -d "./karmen-files" ]; then
  echo "Cannot run karmen without the ./karmen-files directory"
  exit
fi
docker-compose stop
docker-compose up -d
EOF
chmod +x "${DEST}/run-karmen.sh"
zip -r release.zip "$DEST"