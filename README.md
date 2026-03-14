<div align="center">
  <img src="./assets/mitarashi.webp" alt="Mitarashi Idle" width="150">
  <img src="./assets/running_cat.webp" alt="Mitarashi Running" width="150">
  <h1>Desktop Pet Mitarashi</h1>
  <p>Tray-friendly desktop cat mascot built with Electron for Windows, macOS, and Linux.</p>
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

Desktop Pet Mitarashi keeps a cat mascot walking around the outer edges of your desktop. It stays in the tray, supports quick mode switching, can launch at login on Windows and macOS, and includes release automation for shipping builds across all three desktop platforms.

## ✨ Highlights

- Auto-walk the mascot around the top, bottom, left, and right edges of the current display.
- Switch between `Running`, `Idle`, and `Random` modes from the tray.
- Drag the mascot anywhere on screen without losing the quick toggle behavior.
- Change walk speed from the tray menu.
- Toggle a wide background illustration behind the mascot for a more playful scene.
- Enable launch at login on Windows and macOS directly from the tray menu.

## 🚀 Quick Start

```bash
git clone https://github.com/Sunwood-ai-labs/desktop-pet-mitarashi.git
cd desktop-pet-mitarashi
npm ci
npm start
```

## 🎮 Controls

| Action | Result |
| --- | --- |
| Click | Toggle between `Running` and `Idle` while the app is in manual mode |
| Drag | Move the mascot anywhere on screen |
| Double-click the tray icon | Show and focus the mascot window |

## 🪟 Tray Menu

| Menu Item | What It Does |
| --- | --- |
| `Show` | Reopens the mascot window if it is hidden in the tray |
| `Start with Windows` / `Start at Login` | Registers launch at login on supported platforms |
| `Running Mode` / `Idle Mode` / `Random Mode` | Changes the mascot behavior immediately |
| `Speed: Fast` / `Medium` / `Slow` | Sets the walk speed to `8`, `5`, or `2` |
| `Show Background` | Shows or hides the wide background illustration |
| `Quit` | Exits the app completely |

## 📚 Documentation

- Project docs: [sunwood-ai-labs.github.io/desktop-pet-mitarashi](https://sunwood-ai-labs.github.io/desktop-pet-mitarashi/)
- Local docs preview:

```bash
npm run docs:install
npm run docs:dev
```

## 🛠️ Development

```bash
# Build the desktop app
npm run build:win
npm run build:mac
npm run build:linux

# Build the docs site
npm run docs:build
```

Use the build target that matches the platform you are packaging for. For local development, macOS and Windows artifacts are most reliable when built on their native host OS.

The release header asset can be regenerated with the bundled Python helper:

```bash
uv run python scripts/generate_release_header.py --version 0.2.0 --output assets/release-header.svg
```

## 📦 Release Flow

- Tag pushes that match `v*` trigger multi-platform Electron builds in GitHub Actions.
- The tag name is synced back into `package.json` during CI so release artifacts match the published version.
- Release artifacts are attached to a GitHub Release automatically after the build matrix finishes.
- The VitePress docs site is published to GitHub Pages from the `main` branch workflow.

## 🤝 Contributing

Contribution details live in [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and pull requests are welcome.

## 📄 License

This project is released under the [MIT License](./LICENSE).
