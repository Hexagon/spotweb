# Fresh 2.1 Migration Guide

This document describes the migration from Fresh 1.6.8 to Fresh 2.1.3 and the move from deno.land/x to JSR packages.

## Changes Made

### 1. Fresh Framework Update

- **Before:** `https://deno.land/x/fresh@1.6.8/`
- **After:** `jsr:@fresh/core@^2.1.3`

Fresh 2.x has moved from deno.land/x to JSR (JavaScript Registry). The new package is `@fresh/core` on JSR.

### 2. Import Path Changes

All imports from `$fresh/*` have been updated to `fresh/*`:

- `$fresh/server.ts` → `fresh/server`
- `$fresh/dev.ts` → `fresh/dev`
- `$fresh/runtime.ts` → `fresh/runtime`

**Files Updated:**
- main.ts
- dev.ts  
- fresh.gen.ts
- All route files (*.tsx, *.ts in routes/)
- All island files (*.tsx in islands/)
- All component files that import Fresh types

### 3. Preact and Signals Migration

Moved from esm.sh to npm packages (Fresh 2.x requirement):

- `@preact/signals`: `https://esm.sh/*@preact/signals@1.2.2` → `npm:@preact/signals@^2.3.2`
- `@preact/signals-core`: `https://esm.sh/*@preact/signals-core@1.5.1` → `npm:@preact/signals-core@^1.8.0`
- `preact`: `https://esm.sh/preact@10.19.6` → `npm:preact@^10.27.2`
- `preact-render-to-string`: `https://esm.sh/*preact-render-to-string@6.2.2` → `npm:preact-render-to-string@^6.5.15`

### 4. Compiler Options Update

Updated for Fresh 2.x JSX precompilation:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.asynciterable", "dom.iterable", "deno.ns"],
    "jsx": "precompile",
    "jsxImportSource": "preact",
    "jsxPrecompileSkipElements": [
      "a", "img", "source", "body", "html", "head", 
      "title", "meta", "script", "link", "style", 
      "base", "noscript", "template"
    ]
  }
}
```

### 5. Node Modules Directory

Added `"nodeModulesDir": "auto"` to deno.json for better npm package handling.

### 6. Fresh Update Task

Updated the Fresh update command:

- **Before:** `deno run -A -r https://fresh.deno.dev/update .`
- **After:** `deno run -A -r jsr:@fresh/update .`

## Packages Still on deno.land/x

The following packages remain on deno.land/x and should be evaluated for JSR migration when possible:

1. **entsoe_api_client** (`@1.0.3`)
   - Specific ENTSO-E API client
   - Likely to remain on deno.land/x (niche package)

2. **fresh_seo** (`@1.0.1`)
   - Fresh SEO plugin
   - May need compatibility update for Fresh 2.x
   - Check for Fresh 2.x compatible version or JSR alternative

3. **glob_filter** (`@1.0.1`)
   - Small utility package
   - Likely to remain on deno.land/x

4. **localekit_fresh** (`@0.5.2`)
   - i18n plugin for Fresh
   - May need compatibility update for Fresh 2.x
   - Check for Fresh 2.x compatible version or JSR alternative

5. **sqlite3** (`@0.11.1`)
   - SQLite FFI binding
   - Potentially available on JSR as `@db/sqlite`
   - Should be evaluated when JSR access is available

6. **xml** (`@2.1.3`)
   - XML parsing library
   - May have JSR alternatives
   - Should be evaluated when JSR access is available

## Testing Checklist

Once JSR access is enabled in the build environment, test the following:

- [ ] Fresh 2.x dependencies download successfully
- [ ] Application starts without errors (`deno task dev`)
- [ ] All routes render correctly
- [ ] All islands work with client-side interactivity
- [ ] Middleware functions correctly
- [ ] API routes respond properly
- [ ] SEO plugin (fresh_seo) works with Fresh 2.x
- [ ] i18n plugin (localekit_fresh) works with Fresh 2.x
- [ ] Database operations work correctly
- [ ] Static file serving works
- [ ] Tests pass (`deno test`)
- [ ] Build process works (`deno task build`)
- [ ] Production mode works (`deno task prod`)

## Breaking Changes to Watch For

Fresh 2.x introduced some breaking changes:

1. **Import paths**: All `$fresh/*` imports must be updated (✅ Done)
2. **JSX precompilation**: Required for Fresh 2.x (✅ Configured)
3. **npm packages**: Preact and signals must come from npm (✅ Done)
4. **Plugin API**: Some plugins may need updates for Fresh 2.x compatibility

## Plugin Compatibility

The following Fresh plugins need compatibility verification:

- **fresh_seo**: Check if compatible with Fresh 2.x or needs update
- **localekit_fresh**: Check if compatible with Fresh 2.x or needs update

## Future Migrations

Consider migrating these packages to JSR when available:

- sqlite3 → Check for @db/sqlite on JSR
- xml → Check for @std/xml or alternatives on JSR

## References

- [Fresh 2.0 Announcement](https://deno.com/blog/fresh-2)
- [Fresh Documentation](https://fresh.deno.dev/)
- [JSR - JavaScript Registry](https://jsr.io/)
