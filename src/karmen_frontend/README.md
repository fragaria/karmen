# Karmen frontend

Frontend browser UI for Karmen bootstrapped with [react-scripts](https://www.npmjs.com/package/react-scripts).

## Development

```sh
nvm install
nvm use
npm install
npm start
```

Visit `http://localhost:3000`.

### Docker
 
```sh
docker build --build-arg REACT_APP_GIT_REV=`git rev-parse --short HEAD` -t fragaria/karmen-frontend .
docker run -p 8080:8080 -e ENV=develop -e BACKEND_BASE=http://localhost:5000 fragaria/karmen-frontend
```

`BACKEND_BASE` is a base url of Karmen REST backend.