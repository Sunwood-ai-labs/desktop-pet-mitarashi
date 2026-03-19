# Animation Packs

The built-in cat and penguin packs live under `animation-packs/builtin/` and are tracked with the app.
Any sibling folders you add here can extend or replace those bundled animations.

Drop custom animation packs into a child folder under this directory:

```text
animation-packs/
  your-pack/
    pack.yaml
    idle/
    running/
```

The app also scans these locations:

- `MITARASHI_ANIMATION_PACKS_DIR` if you want to point to one or more custom folders
- Electron `userData/animation-packs` for per-user packs outside the repo

Minimal `pack.yaml`:

```yaml
schema_version: 1
id: penguin-soft-idle
mascot: penguin
animations:
  idle:
    directory: idle
    recursive: true
    extensions: [webp, png]
    selection: random
    interval_ms:
      min: 9000
      max: 13000
```

Supported values:

- `mascot`: `cat` or `penguin`
- `animations`: `idle` and/or `running`
- `file` / `files`: relative file paths
- `directory`: relative folder to scan for images
- `extensions`: optional extension allowlist like `webp`, `png`, `gif`
- `recursive`: optional recursive directory scan
- `replace_default`: replace built-in animations instead of appending
- `selection`: `fixed` or `random`
- `interval_ms` or `switch_interval_ms`: switch timing for random selection

All paths must stay inside the pack folder. Restart the app after adding or changing a pack.
