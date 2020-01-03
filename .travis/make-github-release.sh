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
rm "${DEST}/db/fake-printers.sql"
rm "${DEST}/db/test-users.sql"
echo "${TRAVIS_BRANCH-latest}" > "${DEST}/VERSION"

# Hardcode version into docker-compose
sed -i "s/fragaria\/karmen-frontend/fragaria\/karmen-frontend:${TRAVIS_BRANCH-latest}/g" "${DEST}/docker-compose.yml"
sed -i "s/fragaria\/karmen-backend/fragaria\/karmen-backend:${TRAVIS_BRANCH-latest}/g" "${DEST}/docker-compose.yml"
sed -i "s/fragaria\/karmen-proxy/fragaria\/karmen-proxy:${TRAVIS_BRANCH-latest}/g" "${DEST}/docker-compose.yml"

# Prepare run script
cat << "EOF" > "$DEST/run-karmen.sh"
#!/bin/bash
## Make sure that we are doing this in the right context
PARENT_PATH=$( cd $(dirname $(readlink -f "$0")) ; pwd -P )
cd "$PARENT_PATH"

if [ ! -f "./config.local.cfg" ]; then
  echo "Cannot run karmen without the ./config.local.cfg file"
  exit
fi
docker-compose up -d
EOF
chmod +x "${DEST}/run-karmen.sh"

# Prepare stop script
cat << "EOF" > "$DEST/stop-karmen.sh"
#!/bin/bash
## Make sure that we are doing this in the right context
PARENT_PATH=$( cd $(dirname $(readlink -f "$0")) ; pwd -P )
cd "$PARENT_PATH"

docker-compose stop
EOF
chmod +x "${DEST}/stop-karmen.sh"

# Prepare update script
cat << "EOF" > "$DEST/update.sh"
#!/bin/bash

VERSION='latest'
USAGE="$(basename "$0") [-h|--help] [-v|--version=1.2.3] [--edge] -- Updates this Karmen distribution

By default, updates to the latest stable release

where:
    -h | --help     Show this help text
    -v | --version  Update to a specific version number
    --edge          Update to the latest edge version (might contain non-stable releases. This overrides the --version option
"

for i in "$@"
do
case $i in
    --help|-h)
    echo -n "$USAGE"
    exit
    shift
    ;;
    --edge)
    USE_EDGE=1
    shift
    ;;
    -v=*|--version=*)
    VERSION="${i#*=}"
    shift
    ;;
    *)
          # unknown option
    ;;
esac
done

DIR=`dirname "$0"`
BACKUP_DIR_NAME=backup-`date +"%Y-%m-%d-%H-%M"`
echo -ne "Creating backup (with database datafiles) in ${BACKUP_DIR_NAME}...\n\n"
mkdir -p "${BACKUP_DIR_NAME}" && tar -c --exclude "backup*" . | tar -x --directory "${BACKUP_DIR_NAME}"

if (($USE_EDGE)); then
  echo "Getting edge version number"
  VERSION=`wget -qO- "https://api.github.com/repos/fragaria/karmen/releases" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['tag_name'])"`
fi

echo -ne "Getting the ${VERSION} release...\n\n"
if [ $VERSION = latest ]; then
  RELEASE_BUNDLE_URL="https://github.com/fragaria/karmen/releases/latest/download/release.zip"
else
  RELEASE_BUNDLE_URL="https://github.com/fragaria/karmen/releases/download/${VERSION}/release.zip"
fi

wget -O karmen.zip "${RELEASE_BUNDLE_URL}"
if [[ $wgetreturn -ne 0 ]]; then
  echo "Cannot download the release bundle for ${VERSION}. Check https://github.com/fragaria/karmen/releases if it really exists."
  exit 1
fi

unzip karmen.zip
tar -C "${DIR}/karmen/" -c --exclude 'db/data' . | tar -x --directory .
rm -r karmen/
rm karmen.zip

echo -ne "Stopping Karmen...\n\n"
docker-compose stop

echo -ne "Getting new version...\n\n"
docker-compose pull

echo -ne "To run Karmen again, run \n\n     ./run-karmen.sh\n\n"
EOF
chmod +x "${DEST}/update.sh"

zip -r release.zip "$DEST"
