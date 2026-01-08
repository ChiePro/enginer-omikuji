# Project Structure

## Organization Philosophy

Next.js App Router のファイルベースルーティングに従った構成。シンプルでフラットな階層を維持し、必要に応じて機能単位でディレクトリを分割。

## Directory Patterns

### App Directory
**Location**: `/app/`
**Purpose**: Next.js App Router のルート。ページ、レイアウト、グローバルスタイルを配置
**Example**:
- `layout.tsx`: ルートレイアウト（フォント設定、メタデータ）
- `page.tsx`: トップページ
- `globals.css`: グローバルCSS（Tailwind含む）

### Library Directory
**Location**: `/lib/`
**Purpose**: データ定義、ビジネスロジック、ユーティリティ関数
**Pattern**: データ層とロジック層を分離し、型安全な実装を提供

**Core Fortune System**:
- `fortune-data.ts`: 運勢レベルとメッセージのマスターデータ（イミュータブル、`as const`）
- `fortune-selector.ts`: 重み付き確率分布によるランダム選択ロジック
- `fortune-message-getter.ts`: メッセージ取得ロジック
- `draw-fortune.ts`: 統合関数（データ + ロジック）

**Integrated Fortune System** (将来展開):
- `category-data.ts`: 6カテゴリ定義とメッセージプール（positive/negative各5、計60パターン）
- `overall-fortune-data.ts`: 総合運勢メッセージ（7レベル×5パターン=35メッセージ）
- `category-selector.ts`: 確率的カテゴリアドバイス選択（運勢レベルに応じた分布: 95%→5%）
- `integrated-fortune.ts`: 統合運勢抽選（総合運勢 + 6カテゴリアドバイス）

**Testing Pattern**:
- `__tests__/`: テストファイル（実装と同階層）
- TDD (Test-Driven Development) で実装
- ユニットテスト、統合テスト、パフォーマンステストを網羅
- 純粋関数として実装し、副作用なし、テスト可能性を確保

### Components Directory
**Location**: `/app/components/`
**Purpose**: 再利用可能なUIコンポーネント
**Example**:
- `OmikujiCard.tsx`: おみくじカード表示コンポーネント

## Naming Conventions

- **Files**: PascalCase for components (`RootLayout`, `Home`)
- **Components**: PascalCase、default export
- **Functions**: camelCase
- **CSS**: kebab-case (Tailwind utilities)

## Import Organization

```typescript
// Next.js imports
import type { Metadata } from "next";
import Image from "next/image";

// External libraries
import { Geist, Geist_Mono } from "next/font/google";

// Internal imports (path alias)
import "@/app/globals.css";
```

**Path Aliases**:
- `@/*`: プロジェクトルート（tsconfig.jsonで設定）

## Code Organization Principles

- **Colocation**: 関連するファイルは近くに配置
- **Flat Structure**: 不要な深いネストを避ける
- **Type Safety**: すべてのコンポーネントで型定義を明示
- **Server Components First**: デフォルトはServer Components、必要に応じてClient Componentsを使用
- **Data Immutability**: `as const` と `readonly` を活用したイミュータブルなデータ構造
- **Pure Functions**: 副作用のない純粋関数として実装し、テスト可能性を最大化
- **Test-Driven Development**: RED-GREEN-REFACTOR サイクルで実装

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
