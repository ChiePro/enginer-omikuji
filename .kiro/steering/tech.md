# Technology Stack

## Architecture

Next.js App Router を使用したモダンなReactアプリケーション。シンプルなフロントエンド中心の構成で、認証不要の公開型Webサービス。

## Core Technologies

- **Language**: TypeScript (strict mode)
- **Framework**: Next.js 16.1.1 (App Router)
- **Runtime**: Node.js 24.12.0
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4

## Key Libraries

- **next/font**: Geist フォントファミリーを自動最適化
- **next/image**: 画像最適化

## Development Standards

### Type Safety
- TypeScript strict mode 有効
- target: ES2017
- `@/*` パスエイリアスによるクリーンなimport

### Code Quality
- ESLint (eslint-config-next)
- 型安全性の厳格な適用

### Testing
- 現時点ではテストフレームワーク未導入

## Development Environment

### Required Tools
- Node.js 24.12.0 (Volta で固定)
- npm 11.6.2 (Volta で固定)

### Common Commands
```bash
# Dev: npm run dev
# Build: npm run build
# Start: npm run start
# Lint: npm run lint
```

## Key Technical Decisions

- **App Router**: Next.js 13+ の App Router を採用（pages router ではない）
- **No Authentication**: 一般公開型のため認証機構は不要
- **TypeScript Strict**: 型安全性を最優先
- **Tailwind CSS**: ユーティリティファーストのスタイリング
- **Volta**: Node/npm バージョンをプロジェクトで固定し、環境差異を排除

---
_Document standards and patterns, not every dependency_
