# Karmen proxy

This is a simple openresty-based Lua proxy that incorporates all of the Karmen components
into one place.

- `/` is serving [karmen-frontend](../karmen_frontend)
- `/api` is serving [karmen-backend](../karmen_backend)
- `/proxied-webcam` is proxying the webcam streams

## Configuration

You can control the behaviour by these environment variables:

- `SERVICE_HOST` - Interface on which the proxy will be exposed, defaults to `0.0.0.0`. This is useful when container is
run in the docker's networking host mode.
- `SERVICE_PORT` - Port on which the proxy will be exposed, defaults to `9766`
- `REDIS_HOST` - Redis host, no default
- `REDIS_PORT` - Redis port, no default
- `BACKEND_HOST` - Host of Karmen backend, defaults to `backend_flask`
- `BACKEND_PORT` - Port of Karmen backend, defaults to `9764`
- `FRONTEND_HOST` - Host of Karmen frontend, defaults to `frontend`
- `FRONTEND_PORT` - Port of Karmen frontend, defaults to `9765`

## Webcam proxying

The webcams are dynamically proxied directly through nginx. How does it work?
In every call of the `check_printers` task in `karmen_backend`, every responding
printer is queried for its webcam stream address. If there is one, it is stored in redis cache.

Nginx ([openresty](https://openresty.org/) flavour in particular) in this proxy is then
performing a lookup via lua script connected to the redis cache on every request
to `/proxied-webcam/<ip>`. If it finds an active record,
it passes the connection there, if it doesn't, it responds with 404.