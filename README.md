# Karmen frontend

Frontend browser UI for Karmen bootstrapped with [react-scripts](https://www.npmjs.com/package/react-scripts).

## Development

It is possible to run this as a standalone app, but since you need the backend as well, it is
recommended to run the whole bundle with `docker-compose` as described in [the global README](../../README.md).

```sh
npm install
echo 'window.env = {BACKEND_BASE: "http://localhost:8000/api/2"};' > public/env.js
# (for the first time or if you changed styles)
npm rebuild node-sass
npm start
```

Visit `http://localhost:3000`.

To make the code more readable, apply the automatic formatting by running `npm run lint -- --fix`.

### Icons

Do you need more icons? We are using [IcoMoon](https://icomoon.io/app/). To add more icons to the project:

1. Visit the [IcoMoon app](https://icomoon.io/app/)
1. Click Untitled Project (or Manage Projects)
1. Use the *Import project* and upload the [selection.json](./src/assets/icons/selection.json) file
1. Load the project
1. Use the *search* function to add more icons. Try to keep the style consistent.
1. When you are happy, select *Generate Font* and then download the zip file.
1. Copy everything except `demo-files`, `Read Me.txt` and `demo.html` into `src/assets/icons`. The
git diff should now show the added icons in `style.css`.
1. Use your new icon like `<i className="icon-new"></i>`.


### Docker
 
```sh
docker build --build-arg REACT_APP_GIT_REV=`git rev-parse --short HEAD` -t fragaria/karmen-frontend .
docker run -p 3000:9765 -e ENV=develop fragaria/karmen-frontend
```

You can control the exposed interface and port with the following environment variables. This is useful when container is
run in the docker's networking host mode.

- `SERVICE_HOST` - Interface on which the proxy will be exposed, defaults to `0.0.0.0`. 
- `SERVICE_PORT` - Port on which the proxy will be exposed, defaults to `9766`


There are problems with compiling the app directly for `arm/v7` architecture, so the resulting docker image
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

