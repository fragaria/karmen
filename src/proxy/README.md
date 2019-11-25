# Karmen proxy

This is a simple openresty-based Lua proxy that incorporates all of the Karmen components
into one place.

- `/` is serving [karmen-frontend](../karmen_frontend)
- `/api` is serving [karmen-backend](../karmen_backend)
- `/proxied-webcam` is proxying the webcam streams

## Webcam proxying

In the dev mode (without nginx), the webcam proxying does not really work due to bad
performance of the raw Python.

In production mode (when flask is run through uWSGI and nginx), the webcams are dynamically proxied directly
through nginx. How does it work? In every call of the `check_printers` task, every responding
printer is queried for its webcam stream address. If there is one, it is stored in redis cache.

Nginx ([openresty](https://openresty.org/) flavour in particular) is then performing a lookup via lua script
connected to the redis cache on every request to `/proxied-webcam/<ip>`. If it finds an active record,
it passes the connection there, if it doesn't, it responds with 404.