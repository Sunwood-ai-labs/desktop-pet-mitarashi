<div align="center">
  <img src="./assets/mitarashi.webp" alt="Mitarashi Idle" width="150">
  <img src="./assets/running_cat.webp" alt="Mitarashi Running" width="150">
  <h1>Desktop Pet Mitarashi</h1>
  <p>Windows / macOS / Linux で動く、Electron 製のデスクトップ猫マスコットです。</p>
  <p>
    <img src="https://img.shields.io/badge/Electron-41.0-47848F?logo=electron&logoColor=white" alt="Electron 41">
    <img src="https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux-2F5259" alt="対応プラットフォーム">
    <img src="https://img.shields.io/github/v/release/Sunwood-ai-labs/desktop-pet-mitarashi?display_name=tag" alt="最新リリース">
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

Desktop Pet Mitarashi は、画面下を歩く猫マスコットを常駐表示できるデスクトップアプリです。トレイメニューからモード切替や速度変更を行え、Windows と macOS ではログイン時の自動起動にも対応しています。

## ✨ 特長

- 画面下端を猫が自動で歩く、軽量なデスクトップマスコットです。
- トレイから `Running`、`Idle`、`Random` の各モードを即座に切り替えられます。
- ドラッグで好きな位置へ移動でき、通常クリックで手動モードの切替も行えます。
- 右クリックで歩行速度を `2 -> 4 -> 6 -> 8 -> 2` の順に切り替えられます。
- 背景イラストの表示切替で、少しにぎやかな演出も楽しめます。
- Windows / macOS ではトレイからログイン時起動を有効化できます。

## 🚀 クイックスタート

```bash
git clone https://github.com/Sunwood-ai-labs/desktop-pet-mitarashi.git
cd desktop-pet-mitarashi
npm ci
npm start
```

## 🎮 操作方法

| 操作 | 動作 |
| --- | --- |
| クリック | 手動モード中に `Running` と `Idle` を切り替え |
| ドラッグ | マスコットを任意の位置へ移動 |
| マスコットを右クリック | 速度を `2 -> 4 -> 6 -> 8 -> 2` の順で変更 |
| トレイアイコンをダブルクリック | マスコットウィンドウを再表示してフォーカス |

## 🪟 トレイメニュー

| メニュー | 内容 |
| --- | --- |
| `Show` | トレイに隠れたマスコットを再表示 |
| `Start with Windows` / `Start at Login` | 対応 OS でログイン時起動を設定 |
| `Running Mode` / `Idle Mode` / `Random Mode` | マスコットの挙動を即時変更 |
| `Speed: Fast` / `Medium` / `Slow` | 速度を `8`、`5`、`2` に設定 |
| `Show Background` | 背景イラストの表示を切り替え |
| `Quit` | アプリを完全終了 |

## 📚 ドキュメント

- 公開ドキュメント: [sunwood-ai-labs.github.io/desktop-pet-mitarashi](https://sunwood-ai-labs.github.io/desktop-pet-mitarashi/)
- ローカルプレビュー:

```bash
npm run docs:install
npm run docs:dev
```

## 🛠️ 開発

```bash
# デスクトップアプリのビルド
npm run build:win
npm run build:mac
npm run build:linux

# ドキュメントサイトのビルド
npm run docs:build
```

ローカルビルドでは、生成したいプラットフォームに対応するコマンドを使ってください。特に macOS / Windows 向け成果物は、それぞれの OS 上でのビルドが最も確実です。

リリース用ヘッダー画像は、同梱の Python スクリプトで再生成できます。

```bash
uv run python scripts/generate_release_header.py --version 0.2.0 --output assets/release-header.svg
```

## 📦 リリースフロー

- `v*` 形式のタグを push すると、GitHub Actions が各プラットフォーム向けビルドを実行します。
- CI 実行時にタグ名から `package.json` のバージョンを同期し、成果物の版番号を揃えます。
- ビルド完了後、成果物は GitHub Release に自動で添付されます。
- VitePress ドキュメントは `main` ブランチから GitHub Pages にデプロイされます。

## 🤝 コントリビュート

参加方法は [CONTRIBUTING.md](./CONTRIBUTING.md) にまとめています。Issue と Pull Request を歓迎します。

## 📄 ライセンス

このプロジェクトは [MIT License](./LICENSE) で公開しています。
