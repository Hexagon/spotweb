# fresh project

### Development

Start the project:

```
cd src
deno task start
```

### Build docker container

```
cd src
mkdir -p ../build
deno bundle main.ts ../build/spotweb.ts
cd ..
docker build . --tag=local-spotweb
```

### Run local docker container

Expose only to localhost

```
docker run -d -p 127.0.0.1:8135:8000 -e TZ=Europe/Stockholm--mount type=bind,source=/local/path/to/cache,target=/spotprice/cache --name="spotweb" local-spotweb
```

This will watch the project directory and restart as necessary.
