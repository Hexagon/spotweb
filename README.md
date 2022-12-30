# spotweb

Source code of [https://spot.56k.guru](https://spot.56k.guru) - dockerized open source Deno application that gets and caches electricity prices (spot
price) from ENTSO-e. Currently available in Swedish, Finnish, Danish and Norwegian.

### Development

Start the project (in windows powershell):

```
$env:API_TOKEN="your-entsoe-api-token"; deno task dev
```

This will watch the project directory and restart as necessary.

To update fresh framework using recommended method:

```
deno run -A -r https://fresh.deno.dev/update .
```

To check for general dependency updates:

```
deno run --allow-read=. --allow-write=. --allow-net https://deno.land/x/udd/main.ts --dry-run import_map.json
```

Apply the updates manually!

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
docker run -d -p 127.0.0.1:8135:8000 -e API_TOKEN="your-entsoe-api-token" -e TZ='Europe/Stockholm' --name="spotweb" local-spotweb
```

To use persistant database in a host folder, add this parameter to the `docker run` command

```
-v /path/on/host/spotweb/db:/spotweb/db
```
