# How to run this

```sh
nvm install
nvm use
npm install
npm start
```
Go to `http://localhost:3000`


## Docker
 
```sh
docker build --build-arg REACT_APP_GIT_REV=`git rev-parse --short HEAD` -t karmen/frontend .
docker run -p 8080:8080 -e BACKEND_BASE=http://localhost:5000 karmen/frontend
```