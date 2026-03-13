<div align="center">
  <img src="./assets/mitarashi.webp" alt="みたらし" width="200">
  <h1>デスクトップマスコット みたらし</h1>
  <p>画面下を走るかわいい猫のデスクトップマスコット</p>
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

画面下を自動で走るかわいい猫のデスクトップマスコットアプリケーションです。

## 特徴

- **自動走行モード**: 猫が画面下を自動で歩き回ります
- **待機モード**: ダブルクリックで待機モード（静止画）に切り替え
- **ドラッグ移動**: クリックしてドラッグすると、画面上の好きな場所に移動できます
- **常に最前面**: 他のウィンドウの上に表示され続けます
- **透過ウィンドウ**: 背景なしでキャラクターが表示されます
- **速度変更**: 右クリックで歩く速度を変更できます

## 操作方法

| 操作 | 結果 |
|------|------|
| **ドラッグ** | 猫を移動 |
| **ダブルクリック** | 待機/走行モード切り替え |
| **右クリック** | 歩行速度の変更 (2 → 4 → 6 → 8 → 2...) |

## 技術スタック

- **Electron**: デスクトップアプリケーションフレームワーク
- **Vanilla JS**: 軽量で高速

## インストール

```bash
git clone https://github.com/Sunwood-ai-labs/desktop-pet-mitarashi.git
cd desktop-pet-mitarashi
npm install
```

## 開発

```bash
npm start
```

## ビルド

```bash
# Windows用
npm run build:win

# macOS用
npm run build:mac

# Linux用
npm run build:linux
```

## ライセンス

MIT License - [LICENSE](LICENSE) をご覧ください。

## クレジット

- キャラクターデザイン: オリジナルアーティスト
- Electron で構築
