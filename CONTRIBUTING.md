# Contributing to Desktop Pet Mitarashi

Thank you for your interest in contributing to Desktop Pet Mitarashi!

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request, please create an issue on GitHub.

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Local Setup

Install the desktop app dependencies from the repository root:

```bash
npm ci
```

Install the documentation dependencies when you need to work on the VitePress site:

```bash
npm run docs:install
```

Start the desktop app locally:

```bash
npm start
```

Run the docs site locally:

```bash
npm run docs:dev
```

## Validation

Before opening a pull request, run the checks that match your changes:

```bash
# Build the docs site
npm run docs:build

# Build the desktop app for your platform
npm run build:win
npm run build:mac
npm run build:linux
```

Use the build command that matches the platform you are packaging for. Cross-platform desktop artifacts may require the corresponding host OS in local development.

If you regenerate the release header artwork, use `uv run` for the Python helper:

```bash
uv run python scripts/generate_release_header.py --version 0.2.0 --output assets/release-header.svg
```

## Development Guidelines

- Follow the existing code style
- Update the English and Japanese docs together when behavior changes
- Update documentation as needed
- Keep commits atomic and well-described

## Code of Conduct

Be respectful and constructive in all interactions.
