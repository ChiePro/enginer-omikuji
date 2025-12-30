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
**Example**:
- `fortune-data.ts`: 運勢レベルとメッセージのマスターデータ（イミュータブル、`as const`）
- `fortune-selector.ts`: 重み付き確率分布によるランダム選択ロジック
- `draw-fortune.ts`: 統合関数（データ + ロジック）
- `__tests__/`: テストファイル（実装と同階層）

**Testing Pattern**:
- TDD (Test-Driven Development) で実装
- ユニットテスト、統合テスト、パフォーマンステストを網羅
- 純粋関数として実装し、副作用なし、テスト可能性を確保

### Future Patterns (想定)
**Location**: `/app/components/` または `/components/`
**Purpose**: 再利用可能なUIコンポーネント
**Example**: おみくじ表示、結果カードなど

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
