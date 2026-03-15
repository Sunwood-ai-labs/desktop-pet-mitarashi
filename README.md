<div align="center">
  <img src="./assets/mitarashi.webp" alt="Mitarashi Idle" width="150">
  <img src="./assets/running_cat.webp" alt="Mitarashi Running" width="150">
  <h1>Desktop Pet Mitarashi</h1>
  <p>Tray-friendly Electron desktop pets for Windows, macOS, and Linux.</p>
  <p>
    <img src="https://img.shields.io/badge/Electron-41.0-47848F?logo=electron&logoColor=white" alt="Electron 41">
    <img src="https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux-2F5259" alt="Platforms">
    <img src="https://img.shields.io/github/v/release/Sunwood-ai-labs/desktop-pet-mitarashi?display_name=tag" alt="Latest release">
    <img src="https://img.shields.io/badge/License-MIT-D98943.svg" alt="MIT License">
  </p>
  <p>
    <a href="./README.md"><strong>English</strong></a>
    |
    <a href="./README.ja.md"><strong>日本語</strong></a>
    |
    <a href="https://sunwood-ai-labs.github.io/desktop-pet-mitarashi/"><strong>Docs</strong></a>
  </p>
</div>

Desktop Pet Mitarashi keeps mascot windows walking around the outer edges of your desktop. The current app launches two independent mascots, a cat and a penguin, each in its own transparent click-through Electron window so they can turn corners separately and drift at slightly different speeds.

## Highlights

- Launch two independent mascots that move around the current display without blocking clicks.
- Switch between `Running`, `Idle`, `Random`, and `Codex` modes from the tray.
- Let `Codex Mode` mirror live Codex activity by polling `.codex/state_5.sqlite`.
- Give the cat and penguin separate speed multipliers so their movement does not stay locked together.
- Keep the mascot windows always on top while remaining click-through.
- Toggle a wide background illustration behind the mascots.
- Enable launch at login on Windows and macOS directly from the tray.

## Quick Start

```bash
git clone https://github.com/Sunwood-ai-labs/desktop-pet-mitarashi.git
cd desktop-pet-mitarashi
npm ci
npm start
```

`npm start` launches both mascot windows and creates the tray icon.

## Controls

| Action | Result |
| --- | --- |
| Double-click the tray icon | Reveal all mascot windows without stealing focus |

## Tray Menu

| Menu Item | What It Does |
| --- | --- |
| `Show` | Reopens the mascot windows if they are hidden in the tray |
| `Start with Windows` / `Start at Login` | Registers launch at login on supported platforms |
| `Running Mode` / `Idle Mode` / `Random Mode` / `Codex Mode` | Changes mascot behavior immediately. `Codex Mode` polls `.codex/state_5.sqlite` and scales movement from live task activity |
| `Speed: Fast` / `Medium` / `Slow` | Sets the shared base speed to `8`, `5`, or `2`, then applies each mascot's own speed multiplier |
| `Show Background` | Shows or hides the wide background illustration |
| `Quit` | Exits the app completely |

## Windows Executables

After `npm run build:win`, the main Windows outputs are:

- Portable executable: `dist/Mitarashi Desktop Pet <version>.exe`
- Unpacked app folder: `dist/win-unpacked/Mitarashi Desktop Pet.exe`

The unpacked executable is useful for debugging packaged behavior, while the portable `.exe` is the easiest file to share or run directly.

## Documentation

- Project docs: [sunwood-ai-labs.github.io/desktop-pet-mitarashi](https://sunwood-ai-labs.github.io/desktop-pet-mitarashi/)
- Local docs preview:

```bash
npm run docs:install
npm run docs:dev
```

## Development

```bash
# Build the desktop app
npm run build:win
npm run build:mac
npm run build:linux

# Build the docs site
npm run docs:build
```

Use the build target that matches the platform you are packaging for. For local development, Windows artifacts are most reliable when built on Windows and macOS artifacts are most reliable when built on macOS.

The release header asset can be regenerated with the bundled Python helper:

```bash
uv run python scripts/generate_release_header.py --version 0.2.0 --output assets/release-header.svg
```

## Developer Notes

- `main.js` creates one `BrowserWindow` per mascot from `MASCOT_WINDOW_CONFIGS`.
- Each mascot window loads `index.html` with a query string such as `?mascot=cat` or `?mascot=penguin`.
- The renderer owns its own edge path, current corner, and speed multiplier, so the two mascots can turn independently.
- Tray commands still broadcast shared mode and speed changes to both mascots.

## Release Flow

- Tag pushes that match `v*` trigger multi-platform Electron builds in GitHub Actions.
- The tag name is synced back into `package.json` during CI so release artifacts match the published version.
- Release artifacts are attached to a GitHub Release automatically after the build matrix finishes.
- The VitePress docs site is published to GitHub Pages from the `main` branch workflow.

## Contributing

Contribution details live in [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and pull requests are welcome.

## License

This project is released under the [MIT License](./LICENSE).
