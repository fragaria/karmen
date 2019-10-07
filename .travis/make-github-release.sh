#!/bin/bash

DIR=$(dirname $(realpath -s $0))
cd $DIR
DEST="karmen"

# Create release bundle
rm -r "$DEST" 2> /dev/null
mkdir -p "${DEST}/db"
cp ../README.md "${DEST}"
cp ../docker-compose.release.yml "${DEST}/docker-compose.yml"
cp ../src/karmen_backend/config.release.cfg "${DEST}/config.local.cfg.sample"
cp -r ../src/karmen_backend/db/* "${DEST}/db"
mv "${DEST}/db/migrations.release.yml" "${DEST}/db/migrations.yml"
rm "${DEST}/db/fake-printers.sql"
echo "${TRAVIS_BRANCH-latest}" > "${DEST}/VERSION"

# Hardcode version into docker-compose
sed -i "s/fragaria\/karmen-frontend/fragaria\/karmen-frontend:${TRAVIS_BRANCH-latest}/g" "${DEST}/docker-compose.yml"
sed -i "s/fragaria\/karmen-backend/fragaria\/karmen-backend:${TRAVIS_BRANCH-latest}/g" "${DEST}/docker-compose.yml"

# Prepare run script
cat << "EOF" > "$DEST/run-karmen.sh"
#!/bin/bash
if [ ! -f "./config.local.cfg" ]; then
  echo "Cannot run karmen without the ./config.local.cfg file"
  exit
fi
docker-compose stop
docker-compose up -d
EOF
chmod +x "${DEST}/run-karmen.sh"

# Prepare update script
cat << "EOF" > "$DEST/update.sh"
#!/bin/bash
DIR=`dirname "$0"`
BACKUP_DIR_NAME=backup-`date +"%Y-%m-%d-%H-%M"`

echo -ne "Creating backup (without datafiles) in ${BACKUP_DIR_NAME}...\n\n"
mkdir -p "${BACKUP_DIR_NAME}" && tar -c --exclude 'db/data' --exclude "backup*" . | tar -x --directory "${BACKUP_DIR_NAME}"

echo -ne "Getting the latest release...\n\n"
wget -O karmen.zip https://github.com/fragaria/karmen/releases/latest/download/release.zip
unzip karmen.zip
# TODO fix this
tar -C "${DIR}/karmen/" -c --exclude 'db/data' . | tar -x --directory .
rm -r karmen/
rm karmen.zip

echo -ne "Stopping Karmen...\n\n"
docker-compose stop

echo -ne "Getting new version...\n\n"
docker-compose pull

echo -ne "To run Karmen again, run \n\n     BASE_HOST=<public-ip-address> ./run-karmen.sh\n\n"
EOF
chmod +x "${DEST}/update.sh"

zip -r release.zip "$DEST"