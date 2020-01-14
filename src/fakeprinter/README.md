# Karmen fake printer

Minimalistic emulator of Octoprint API.

## Development

The preferred way is to use the composed docker package as [described in here](../../README.md).

### Docker

```sh
docker build -t fragaria/karmen-fakeprinter .
docker run -p8080:8080 fragaria/karmen-fakeprinter
```

You can control the exposed interface and port with the following environment variables. This is useful when container is
run in the docker's networking host mode.

- `SERVICE_HOST` - Interface on which the proxy will be exposed, defaults to `0.0.0.0`. 
- `SERVICE_PORT` - Port on which the proxy will be exposed, defaults to `9766`
