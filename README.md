<div align="center">
  <img src="./assets/mitarashi.webp" alt="Mitarashi" width="200">
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
- **Idle Mode**: Double-click to switch to idle mode (static image)
- **Draggable**: Click and drag to move the cat anywhere on your screen
- **Always on Top**: Stays visible above other windows
- **Transparent Window**: The character appears without a background window
- **Speed Control**: Right-click to change walking speed

## Controls

| Action | Result |
|--------|--------|
| **Drag** | Move the cat around |
| **Double-click** | Toggle between idle/running mode |
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

## Build

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- Character design: Original artist
- Built with Electron
