# はじめに

## 必要なもの

- Node.js 20 以上
- npm
- デスクトップアプリを実行するための Windows / macOS / Linux 環境

## インストールと起動

リポジトリのルートで次を実行します。

```bash
npm ci
npm start
```

Electron アプリが起動し、トレイアイコンも作成されます。マスコットのウィンドウを閉じてもアプリは終了せず、トレイに隠れます。

## ドキュメントのローカル表示

VitePress の依存関係を一度だけインストールします。

```bash
npm run docs:install
```

その後、ローカル docs サイトを起動します。

```bash
npm run docs:dev
```

## 自動起動

対応プラットフォームでは、トレイメニューからログイン時起動を設定できます。

- Windows: `Start with Windows`
- macOS: `Start at Login`

Windows でログイン時起動した場合、サインイン直後にフォーカスを奪わないよう、アプリはトレイに隠れた状態で起動します。
