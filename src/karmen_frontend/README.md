# Karmen frontend

Frontend browser UI for Karmen bootstrapped with [react-scripts](https://www.npmjs.com/package/react-scripts).

## Development

It is possible to run this as a standalone app, but since you need the backend as well, it is
recommended to run the whole bundle with `docker-compose` as described in [the global README](../../README.md).

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
docker run -p 3000:9765 -e ENV=develop fragaria/karmen-frontend
```

There are problems with compiling the app directly for arm/v7 architecture, so the resulting docker image
is `Dockerfile.serve` serving a JS bundle compiled with `Dockerfile.build`. The `Dockerfile` is used
for development only.

## User access model

Since all of the operations require a valid JWT tied to a user account, you have to go through a login screen
every time you want to access the application. The JWT's are stored in your browser, however, and you will
be automatically logged in if you come back within 30 days.

If you want a more permanent setup, for example for a monitoring dashboard, create an API token that has
no expiration date. You can then run the app with the `token` query param such as:

`http://karmen.local?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9......`

If no valid user session is detected, the token gets consumed by the frontend app and is remembered by
the browser until you press the logout button.

