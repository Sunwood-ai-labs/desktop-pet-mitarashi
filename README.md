<div align="center">
  <img src="./assets/mitarashi.webp" alt="Mitarashi Idle" width="150">
  <img src="./assets/running_cat.webp" alt="Mitarashi Running" width="150">
  <h1>Desktop Pet Mitarashi</h1>
  <p>A cute running cat desktop mascot application</p>
  <p>
    <img src="https://img.shields.io/badge/Electron-41.0-47848F?logo=electron&logoColor=white" alt="Electron">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  </p>
  <p>
    <a href="./README.md">
      <img src="https://img.shields.io/badge/Language-English-blue.svg" alt="English">
    </a>
    <a href="./README.ja.md">
      <img src="https://img.shields.io/badge/Language-Japanese-lightgrey.svg" alt="Japanese">
    </a>
  </p>
</div>

---

A desktop mascot application featuring a cute running cat that walks along the bottom of your screen.

## Features

- **Auto-Walk Mode**: The cat automatically walks along the bottom of your screen
- **Idle Mode**: Click to switch to idle mode (static image)
- **Draggable**: Click and drag to move the cat anywhere on your screen
- **Always on Top**: Stays visible above other windows
- **Transparent Window**: The character appears without a background window
- **Speed Control**: Right-click to change walking speed
- **Startup Toggle**: Enable launch at login from the tray menu

## Controls

| Action | Result |
|--------|--------|
| **Click** | Toggle between idle/running mode |
| **Drag** | Move the cat around |
| **Right-click** | Change walking speed (2 → 4 → 6 → 8 → 2...) |

## Tech Stack

- **Electron**: Desktop application framework
- **Vanilla JS**: Lightweight and fast

## Installation

```bash
git clone https://github.com/Sunwood-ai-labs/desktop-pet-mitarashi.git
cd desktop-pet-mitarashi
npm install
```

## Development

```bash
npm start
```

## Startup

To launch Mitarashi automatically when you sign in:

1. Start the app.
2. Open the tray icon menu.
3. Enable `Start with Windows` on Windows or `Start at Login` on macOS.

On Windows, the auto-launched app starts hidden in the tray so it does not steal focus during login.

## Build

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

## CI/CD

This project uses GitHub Actions for automated builds and releases.

- **On tag push (v*)**: Builds for all platforms and creates a GitHub Release
- **Version sync on tag builds**: `v0.2.0` style tags automatically set the app version to `0.2.0` during CI before packaging
- **Manual dispatch**: Build artifacts without creating a release

## Development Scripts

### Release Header Generator

Generate a release header image for GitHub releases:

```bash
uv run python scripts/generate_release_header.py --version 0.1.0 --output assets/release-header-v0.1.0.svg
```

**Options:**
- `--version`: Version string (e.g., `0.1.0`)
- `--output`: Output file path
- `--source`: Source SVG file (default: `assets/mitarashi_minimal.svg`)

The script extracts the cat character from `mitarashi_minimal.svg`, cleans Inkscape metadata, and generates a styled header image with the project branding.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- Character design: Original artist
- Built with Electron
