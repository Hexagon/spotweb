# spotweb

Source code of [https://spot.56k.guru](https://spot.56k.guru) - dockerized open source Deno application that gets and caches electricity prices (spot
price) from ENTSO-e.

Currently available in Swedish, Finnish, Danish, Norwegian, Spanish, French, Polish and German.

Any feedback on translations are greatly appreciated. Contribute by opening an issue, or by creating a pull request. Each language has it's own file
in `config/translations`.

[![Deno CI](https://github.com/Hexagon/spotweb/actions/workflows/deno.yaml/badge.svg)](https://github.com/Hexagon/spotweb/actions/workflows/deno.yaml)

### Development

Start the project, pass your Entso-e api key in environment variable `API_TOKEN` (in windows powershell):

```
$env:API_TOKEN="your-entsoe-api-token"; deno task dev
```

#### Contributing

Pull requests are very welcome! Please run `deno task precommit` before submitting a pr. This will make sure format, linting, types are up to
standards, and tests pass.

#### Dependency updates

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

### Running in production

Spotweb is set up to run using [Pup](https://github.com/hexagon/pup) in production. Follow tre quick guide there to run `pup run` or install as a
system service `pup install --name spotweb`

The database will be stored in `<project-directory>/db/`

```
-v /path/on/host/spotweb/db:/spotweb/db
```
