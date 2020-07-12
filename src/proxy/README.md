# Karmen proxy

This is a simple openresty-based Lua proxy that incorporates all of the Karmen components
into one place.

- `/` is serving [karmen-frontend](../karmen_frontend)
- `/api` is serving [karmen-backend](../karmen_backend)

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

## Maintenace mode

You can switch nginx proxy to maintenance mode - 503 responses will be served from api and frontend

`docker exec -d karmen_proxy_1 touch /maintenance`
`docker exec -d karmen_proxy_1 rm /maintenance`
