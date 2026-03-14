# Getting Started

## Requirements

- Node.js 20 or later
- npm
- Windows, macOS, or Linux for running the desktop app

## Install and Run

From the repository root:

```bash
npm ci
npm start
```

This launches the Electron app and creates a tray icon. Closing the mascot window hides it in the tray instead of quitting the app.

## Preview the Docs

Install the docs dependencies once:

```bash
npm run docs:install
```

Then run the local VitePress site:

```bash
npm run docs:dev
```

## Startup Behavior

The tray menu exposes a startup toggle on supported platforms:

- Windows: `Start with Windows`
- macOS: `Start at Login`

When the app launches at login on Windows, it starts hidden in the tray so it does not steal focus during sign-in.
