trap "kill 0" EXIT
# so all childs are killed when we are done

# the script is pextected to be run from repo root
WORKDIR=$(pwd)

#start frontend
(docker-compose up --build &)

sleep 60

mkdir -p test-tmp
rm -rf test-tmp/*
#git clone git@bitbucket.org:fragariacz/karmen-backend2.git test-tmp/backend
#git -c "http.extraHeader=Authorization: Basic YWRhbWplemVrOTg6dWVMcWZHRGhXUDRhTFVlc1hiUVc=" clone https://adamjezek98@bitbucket.org/fragariacz/karmen-backend2.git
git clone https://$BITBUCKET_USERNAME:$BITBUCKET_ACCESS_PASSWORD@bitbucket.org/fragariacz/karmen-backend2.git

git clone git@github.com:fragaria/karmen-fakeprinter.git test-tmp/fakeprinter

cp .travis/local_settings.py test-tmp/backend/karmen/karmen/

(cd test-tmp/backend;
pipenv install;
#pipenv install django_extensions;
#pipenv install django-cache-memoize;
pipenv run karmen/manage.py migrate;
pipenv run karmen/manage.py generate_test_data;
pipenv run karmen/manage.py runserver & > /dev/null 2>&1)

# spin up one fakeprinter
(cd test-tmp/fakeprinter; SERVICE_PORT=5050 sh scripts/fakeprinter-start.sh & > /dev/null 2>&1)
# spin up second fakeprinter
#(cd test-tmp/fakeprinter; SERVICE_PORT=5051 sh scripts/fakeprinter-start.sh &)


npm run test:cypress

sleep 10

# kill everything from this session
# kudos to https://unix.stackexchange.com/questions/124127/kill-all-descendant-processes
# but also that trap at the top is needed
#kill $(ps -s $$ -o pid=)
