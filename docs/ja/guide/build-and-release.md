# ビルドとリリース

## ローカルビルド

リポジトリのルートから次を実行します。

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

生成物は `dist/` に出力されます。

生成したい成果物に対応するコマンドを使ってください。ローカル開発では、Windows 向けは Windows 上、macOS 向けは macOS 上でのビルドが最も確実です。

## タグベースのリリース

このリポジトリには GitHub Actions ワークフローが含まれており、次の流れでリリースを自動化します。

1. `v*` 形式のタグを検出
2. タグのバージョンを `package.json` に同期
3. Windows / macOS / Linux 向け成果物をビルド
4. GitHub Release に成果物を添付

例:

```bash
git tag v0.2.0
git push origin v0.2.0
```

## リリースヘッダー画像の再生成

同梱の Python ヘルパーは `uv run` で実行します。

```bash
uv run python scripts/generate_release_header.py --version 0.2.0 --output assets/release-header.svg
```

## docs サイトの公開

`docs.yml` ワークフローは `docs/` から VitePress サイトをビルドし、`docs/.vitepress/dist` を GitHub Pages にデプロイします。
