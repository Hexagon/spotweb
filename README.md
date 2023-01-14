# spotweb

Source code of [https://spot.56k.guru](https://spot.56k.guru) - dockerized open source Deno application that gets and caches electricity prices (spot
price) from ENTSO-e.

Currently available in Swedish, Finnish, Danish, Norwegian and German.

Any feedback on translations are greatly appreciated. Contribute by opening an issue, or by creating a pull request. Each language has it's own file
in `config/translations`.

### Development

Start the project (in windows powershell):

```
$env:API_TOKEN="your-entsoe-api-token"; deno task dev
```

This will watch the project directory and restart as necessary.

To update fresh framework using recommended method:

```
deno task update-fresh
```

To check for general dependency updates:

```
deno task update-deps
```

Apply the updates manually

Also check `SwHead.tsx` for dependencies included by script tags.

Note that the types declarations in deno.json have to be updated if updating dependencies in `import_map.json` or script-tags in `SwHead.tsx`.

### Build docker container

```
deno task release # Generates main.release.ts using deno bundle
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
