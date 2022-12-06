# library-displays

Python 3 Flask service to display equipment and workstation information.

## Requires

* Python 3.10.8

### Development Setup

See [docs/DevelopmentSetup.md](docs/DevelopmentSetup.md).

## Environment Configuration

The application requires a ".env" file in the root directory to provide
server-specific information (i.e., those parts of the configuration that
may vary based on whether the server is a test/qa/production server).

A sample "env_example" file has been provided to assist with this process.
Simply copy the "env_example" file to ".env" and fill out the parameters as
appropriate.

The configured .env file should not be checked into the Git repository.

### Running in Docker

```bash
$ docker build -t docker.lib.umd.edu/library-monitors .
$ docker run -it --rm -p 5000:5000 --env-file=.env --read-only docker.lib.umd.edu/library-monitors
```

### Building for Kubernetes

```bash
$ docker buildx build . --builder=kube -t docker.lib.umd.edu/library-monitors:VERSION --push
```

### Pages

This service exposes the following URLs for monitor display:

Combined Displays:

* <http://localhost:5000/monitors/mckeldin>
* <http://localhost:5000/monitors/stem>

Legacy Workstation Displays:

* <http://localhost:5000/monitors/mckeldin-workstations-legacy>
* <http://localhost:5000/monitors/stem-workstations-legacy>

Legacy Equipment Displays:

* <http://localhost:5000/monitors/stem-equipment-legacy>
* <http://localhost:5000/monitors/mckeldin-equipment-legacy>

### API Endpoints

The combined displays are dependent on the following JSON endpoints:

* <http://localhost:5000/api/workstations-stem.json>
* <http://localhost:5000/api/equipment-stem.json>
* <http://localhost:5000/api/workstations-mckeldin.json>
* <http://localhost:5000/api/equipment-mckeldin.json>

Root endpoint (just returns `{status: ok}` to all requests):
<http://localhost:5000/>

/ping endpoint (just returns `{status: ok}` to all requests):
<http://localhost:5000/ping>
