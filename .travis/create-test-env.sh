trap "kill 0" EXIT
# so all childs are killed when we are done

# the script is pextected to be run from repo root
WORKDIR=$(pwd)

#start frontend
#(docker-compose up --build &)

#sleep 60


mkdir -p test-tmp
rm -rf test-tmp/*
git clone https://${BITBUCKET_USERNAME}:${BITBUCKET_ACCESS_PASSWORD}@bitbucket.org/fragariacz/karmen-backend2.git test-tmp/backend


#eval "$(ssh-agent -s)"
## So travis won't let add ssh keys with public repos
## So we just take that multiline key and shove it into env var as self-evaluating single-line echo
#echo ${BITBUCKET_SSH_KEY} | tr " " "\n" > id_rsa_travis
#
#cat id_rsa_travis
#wc -l id_rsa_travis
## of course there is the 'authenticity can't be established' stuff
##echo -e "Host bitbucket.org\n\tStrictHostKeyChecking no" > ~/.ssh/config
#ssh-keyscan -H bitbucket.org >>  ~/.ssh/known_hosts
#
#echo "test"
## gotta make it stop bitching about permissions
#chmod 600 id_rsa_travis
#
#ssh-add id_rsa_travis
#echo "a"
#ssh-agent bash -c 'ssh-add id_rsa_travis; git clone git@bitbucket.org:fragariacz/karmen-backend2.git'
#git clone git@bitbucket.org:fragariacz/karmen-backend2.git test-tmp/backend
#


echo ""


git clone https://github.com/fragaria/karmen-fakeprinter.git test-tmp/fakeprinter

cp .travis/local_settings.py test-tmp/backend/karmen/karmen/


#pyenv shell 3.6.7
#sudo apt install python3.6 python3-pip --yes
#
#pip3 install pipenv
#
#echo "kinda"
#
#python3 -m pip install pipenv


cd test-tmp/backend;
rm Pipfile.lock
pipenv install --python 3.7;
pipenv run python --version
#pipenv install django_extensions;
#pipenv install django-cache-memoize;
pipenv run karmen/manage.py migrate;
pipenv run karmen/manage.py generate_test_data;
pipenv run karmen/manage.py runserver # & > /dev/null 2>&1

# spin up one fakeprinter
(cd test-tmp/fakeprinter; SERVICE_PORT=5050 sh scripts/fakeprinter-start.sh & > /dev/null 2>&1)
# spin up second fakeprinter
#(cd test-tmp/fakeprinter; SERVICE_PORT=5051 sh scripts/fakeprinter-start.sh &)

npm install
cd cypress
npm install

# wait for FE and BE to start up

#while ! curl -I localhost:8000 > /dev/null 2>&1; do echo 'Waiting for backend...'; sleep 1; done
while ! curl -I localhost:3000 > /dev/null 2>&1; do echo 'Waiting for frontend...'; sleep 1; done

npm run test:cypress

sleep 10

# kill everything from this session
# kudos to https://unix.stackexchange.com/questions/124127/kill-all-descendant-processes
# but also that trap at the top is needed
#kill $(ps -s $$ -o pid=)
