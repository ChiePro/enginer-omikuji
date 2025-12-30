# トップページ技術設計書

## 概要

エンジニア向けおみくじWebサービスのトップページの技術設計書。要件定義（WHAT）をアーキテクチャ設計（HOW）に変換し、実装可能な技術仕様を定義する。

## アーキテクチャパターン

### レイヤードアーキテクチャ
```
┌─────────────────────────────────────────────────┐
│         Presentation Layer (Next.js App)         │
├─────────────────────────────────────────────────┤
│           Application Layer (Use Cases)          │
├─────────────────────────────────────────────────┤
│            Domain Layer (Business Logic)         │
├─────────────────────────────────────────────────┤
│       Infrastructure Layer (Repositories)        │
└─────────────────────────────────────────────────┘
```

### コンポーネント境界マップ
```
src/app/page.tsx (Server Component)
├── components/layout/HeroSection
│   ├── ShrineBgVisual (Server)
│   └── CatchCopy (Server)
├── features/omikuji/TopPageOmikujiSection (Server)
│   ├── OmikujiTypeGrid (Server)
│   └── OmikujiCard (Client) ← アニメーション
├── features/motivation/RarityPreview (Client)
│   └── RarityTier (Client) ← エフェクト
└── features/motivation/SaisenHint (Server)
    └── SaisenBox3D (Client) ← 3Dアニメーション

// エラーハンドリング境界
src/app/
├── error.tsx (Client) ← ルートエラーバウンダリ
├── not-found.tsx (Server) ← 404エラーページ
└── global-error.tsx (Client) ← グローバルエラーバウンダリ
```

## 技術スタックと整合性

### フロントエンド技術選定
| 技術 | 用途 | 選定理由 |
|------|------|----------|
| Next.js 16 App Router | フレームワーク | Server Components対応、高速な初期表示 |
| TypeScript 5.x | 言語 | 型安全性の確保、DDD実装支援 |
| Tailwind CSS | スタイリング | ユーティリティファースト、高速開発 |
| Framer Motion | アニメーション | 高パフォーマンス、宣言的API |
| Radix UI | UIプリミティブ | アクセシビリティ対応済み |

### 開発環境
- pnpm: パッケージ管理
- Vitest: ユニットテスト
- Playwright: E2Eテスト
- Storybook: コンポーネントカタログ

## コンポーネントと インターフェース定義

### 1. HeroSection (FR-TOP-001)
#### 概要
神社×テクノロジーの融合ビジュアルを表現するヒーローセクション。

#### インターフェース
```typescript
// src/components/layout/HeroSection/types.ts
export interface HeroSectionProps {
  catchCopy: {
    main: string;
    sub: string;
  };
  backgroundVariant?: 'default' | 'festival' | 'night';
}

// src/components/layout/HeroSection/index.tsx
export const HeroSection: React.FC<HeroSectionProps> = ({
  catchCopy,
  backgroundVariant = 'default'
}) => {
  // Server Component実装
};
```

#### 実装詳細
- Server Componentとして実装（静的コンテンツ）
- 背景画像は`next/image`で最適化
- CSS Grid/Flexboxでレスポンシブ対応

### 2. OmikujiCard (FR-TOP-002)
#### 概要
各おみくじ種類を表示するインタラクティブカード。

#### インターフェース
```typescript
// src/features/omikuji/components/OmikujiCard/types.ts
export interface OmikujiTypeData {
  id: string;
  name: string;
  description: string;
  icon: string | React.ReactNode;
  color: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  route: string;
}

export interface OmikujiCardProps {
  omikujiType: OmikujiTypeData;
  onSelect: (typeId: string) => void;
  isDisabled?: boolean;
}

// src/features/omikuji/components/OmikujiCard/index.tsx
'use client';

export const OmikujiCard: React.FC<OmikujiCardProps> = ({
  omikujiType,
  onSelect,
  isDisabled = false
}) => {
  // Client Component実装（アニメーション）
};
```

#### アニメーション仕様
```typescript
// src/features/omikuji/components/OmikujiCard/animations.ts
export const cardVariants = {
  initial: { scale: 1, y: 0 },
  hover: { 
    scale: 1.05, 
    y: -8,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  tap: { scale: 0.98 }
};
```

### 3. RarityPreview (FR-TOP-003)
#### 概要
レアリティシステムの視覚的プレビュー。

#### インターフェース
```typescript
// src/features/motivation/components/RarityPreview/types.ts
export enum Rarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface RarityTierData {
  rarity: Rarity;
  label: string;
  probability: number;
  color: string;
  effects?: {
    glow?: boolean;
    sparkle?: boolean;
    animation?: string;
  };
}

export interface RarityPreviewProps {
  tiers: RarityTierData[];
  showProbabilities?: boolean;
  animateOnScroll?: boolean;
}
```

### 4. SaisenBox (FR-TOP-003)
#### 概要
お賽銭システムの3Dビジュアル表現。

#### インターフェース
```typescript
// src/features/motivation/components/SaisenBox/types.ts
export interface SaisenBoxProps {
  variant?: 'subtle' | 'prominent';
  showHint?: boolean;
  onInteract?: () => void;
}
```

### 5. エラーハンドリングコンポーネント
#### 概要
アプリケーション全体のエラーハンドリングを担う基盤コンポーネント群。初期セットアップとして実装。

#### 5.1 RootErrorBoundary (error.tsx)
```typescript
// src/app/error.tsx
'use client';

export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 将来のエラー監視ツール統合ポイント
    console.error('Error captured:', error);
  }, [error]);

  return (
    <div className="error-container">
      <ShrineErrorVisual /> {/* 神社モチーフのエラービジュアル */}
      <h1>おみくじが引けません</h1>
      <p>申し訳ございません。神社の準備中です。</p>
      <button onClick={reset} className="reset-button">
        もう一度お参りする
      </button>
    </div>
  );
}
```

#### 5.2 NotFoundPage (not-found.tsx)
```typescript
// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <ShrineNotFoundVisual /> {/* 迷子の神社ビジュアル */}
      <h1>404 - ページが見つかりません</h1>
      <p>お探しのおみくじは別の神社にあるようです。</p>
      <Link href="/" className="home-link">
        トップページへ戻る
      </Link>
    </div>
  );
}
```

#### 5.3 GlobalErrorBoundary (global-error.tsx)
```typescript
// src/app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="global-error-container">
          <h1>重大なエラーが発生しました</h1>
          <p>アプリケーションの再起動が必要です。</p>
          <button onClick={reset}>再起動</button>
        </div>
      </body>
    </html>
  );
}
```

#### 5.4 カスタムエラータイプ
```typescript
// src/domain/errors/ApplicationErrors.ts
export class OmikujiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'OmikujiError';
  }
}

export class OmikujiNotFoundError extends OmikujiError {
  constructor(message: string) {
    super(message, 'OMIKUJI_NOT_FOUND', 404);
    this.name = 'OmikujiNotFoundError';
  }
}

export class OmikujiValidationError extends OmikujiError {
  constructor(message: string) {
    super(message, 'OMIKUJI_VALIDATION_ERROR', 400);
    this.name = 'OmikujiValidationError';
  }
}
```

## データモデル設計

### ドメインモデル振る舞い仕様（BDD）

#### Feature: おみくじタイプの管理
```gherkin
Feature: おみくじタイプの識別と表示
  As a ユーザー
  I want to 複数種類のおみくじから選択する
  So that 自分の関心に合ったおみくじを引くことができる

  Background:
    Given 以下のおみくじタイプが存在する
      | id              | name           | description                | icon | sortOrder |
      | engineer-fortune| エンジニア運勢  | 今日のコーディングを占う     | ⚡   | 1         |
      | tech-selection  | 技術選定おみくじ | 次に学ぶ技術を決める        | 🎲   | 2         |
      | debug-fortune   | デバッグ運      | バグ解決のヒントを得る      | 🐛   | 3         |
      | review-fortune  | コードレビュー運 | レビューの結果を予想       | 👀   | 4         |
      | deploy-fortune  | デプロイ運      | デプロイの成功を占う        | 🚀   | 5         |

  Scenario: 有効なおみくじタイプの作成
    When "engineer-fortune"のIDで新しいおみくじタイプを作成する
    Then おみくじタイプが正常に作成される
    And 一意性が保証される

  Scenario: 無効なIDでのおみくじタイプ作成
    When 空文字列のIDでおみくじタイプを作成しようとする
    Then InvalidOmikujiTypeIdエラーが発生する

  Scenario: おみくじタイプの表示順序
    When すべてのおみくじタイプを取得する
    Then sortOrder順で並べ替えられている
    And エンジニア運勢が最初に表示される
```

#### Feature: カラースキームの検証
```gherkin
Feature: おみくじタイプのカラースキーム管理
  As a デザイナー
  I want to 各おみくじタイプに適切な色を設定する
  So that ユーザーが視覚的に区別しやすくする

  Scenario: 有効なカラーコードでのスキーム作成
    Given プライマリカラーが"#3B82F6"
    And セカンダリカラーが"#1E40AF"
    When カラースキームを作成する
    Then カラースキームが正常に作成される

  Scenario: 無効なカラーコードでのスキーム作成
    Given プライマリカラーが"invalid-color"
    When カラースキームを作成しようとする
    Then InvalidColorCodeエラーが発生する

  Scenario: カラーコントラストの検証
    Given プライマリカラーが"#FFFFFF"
    And セカンダリカラーが"#F0F0F0"
    When カラースキームを作成しようとする
    Then InsufficientContrastエラーが発生する
```

#### Feature: レアリティシステム
```gherkin
Feature: おみくじ結果のレアリティ管理
  As a ユーザー
  I want to レアリティによっておみくじの価値を理解する
  So that 特別な結果への期待感を楽しむことができる

  Scenario: レアリティの段階的価値
    Given レアリティが以下のように定義されている
      | rarity    | probability | value |
      | COMMON    | 60%        | 1     |
      | RARE      | 30%        | 2     |
      | EPIC      | 8%         | 3     |
      | LEGENDARY | 2%         | 4     |
    When レアリティを比較する
    Then LEGENDARYが最も価値が高い
    And COMMONが最も一般的である

  Scenario: レアリティのビジュアル表現
    Given レアリティがEPIC
    When レアリティの表示色を取得する
    Then 紫色系の色が返される
    And キラキラエフェクトが有効になる
```

### ドメインエンティティ実装

```typescript
// src/domain/entities/OmikujiType.ts
export class OmikujiType {
  constructor(
    public readonly id: OmikujiTypeId,
    public readonly name: string,
    public readonly description: string,
    public readonly icon: string,
    public readonly color: OmikujiColorScheme,
    public readonly sortOrder: number
  ) {}

  static create(params: OmikujiTypeParams): OmikujiType {
    const id = OmikujiTypeId.create(params.id);
    const color = OmikujiColorScheme.create(params.color);
    
    return new OmikujiType(
      id,
      params.name,
      params.description,
      params.icon,
      color,
      params.sortOrder
    );
  }

  // 振る舞い：表示順での比較
  compareByOrder(other: OmikujiType): number {
    return this.sortOrder - other.sortOrder;
  }

  // 振る舞い：同一性の判定
  equals(other: OmikujiType): boolean {
    return this.id.equals(other.id);
  }

  // 振る舞い：ユーザー向け表示名の取得
  getDisplayName(): string {
    return `${this.icon} ${this.name}`;
  }
}

// src/domain/valueObjects/OmikujiTypeId.ts
export class OmikujiTypeId {
  private constructor(private readonly value: string) {}

  static create(id: string): OmikujiTypeId {
    if (!id || id.trim().length === 0) {
      throw new InvalidOmikujiTypeIdError('おみくじタイプIDは必須です');
    }
    
    if (!/^[a-z0-9-]+$/.test(id)) {
      throw new InvalidOmikujiTypeIdError('IDは英小文字、数字、ハイフンのみ使用可能です');
    }

    return new OmikujiTypeId(id);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OmikujiTypeId): boolean {
    return this.value === other.value;
  }
}

// src/domain/valueObjects/OmikujiColorScheme.ts
export class OmikujiColorScheme {
  private constructor(
    private readonly primary: string,
    private readonly secondary: string,
    private readonly accent?: string
  ) {}

  static create(params: ColorSchemeParams): OmikujiColorScheme {
    this.validateColorCode(params.primary);
    this.validateColorCode(params.secondary);
    
    if (params.accent) {
      this.validateColorCode(params.accent);
    }

    this.validateContrast(params.primary, params.secondary);

    return new OmikujiColorScheme(
      params.primary,
      params.secondary,
      params.accent
    );
  }

  private static validateColorCode(color: string): void {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color)) {
      throw new InvalidColorCodeError(`無効なカラーコードです: ${color}`);
    }
  }

  private static validateContrast(primary: string, secondary: string): void {
    const contrastRatio = this.calculateContrastRatio(primary, secondary);
    if (contrastRatio < 4.5) {
      throw new InsufficientContrastError('WCAG AAのコントラスト比を満たしていません');
    }
  }

  private static calculateContrastRatio(color1: string, color2: string): number {
    // WCAG 2.1のコントラスト比計算実装
    // 簡略化のため、実際の実装では詳細な計算を行う
    return 5.0; // プレースホルダー
  }

  // 振る舞い：アクセシビリティ準拠の確認
  isAccessible(): boolean {
    return this.calculateContrastRatio(this.primary, this.secondary) >= 4.5;
  }

  // 振る舞い：Tailwind CSS クラス生成
  toTailwindClasses(): { primary: string; secondary: string; accent?: string } {
    return {
      primary: this.colorToTailwind(this.primary),
      secondary: this.colorToTailwind(this.secondary),
      accent: this.accent ? this.colorToTailwind(this.accent) : undefined
    };
  }

  private colorToTailwind(hex: string): string {
    // HEX色をTailwind CSSクラスに変換
    return `bg-[${hex}]`;
  }
}

// src/domain/valueObjects/Rarity.ts
export class Rarity {
  private static readonly VALUES = {
    COMMON: { value: 1, probability: 0.6, label: 'コモン', color: '#9CA3AF' },
    RARE: { value: 2, probability: 0.3, label: 'レア', color: '#3B82F6' },
    EPIC: { value: 3, probability: 0.08, label: 'エピック', color: '#8B5CF6' },
    LEGENDARY: { value: 4, probability: 0.02, label: 'レジェンダリー', color: '#F59E0B' }
  } as const;

  private constructor(
    private readonly type: keyof typeof Rarity.VALUES,
    private readonly config: typeof Rarity.VALUES[keyof typeof Rarity.VALUES]
  ) {}

  static COMMON = new Rarity('COMMON', Rarity.VALUES.COMMON);
  static RARE = new Rarity('RARE', Rarity.VALUES.RARE);
  static EPIC = new Rarity('EPIC', Rarity.VALUES.EPIC);
  static LEGENDARY = new Rarity('LEGENDARY', Rarity.VALUES.LEGENDARY);

  // 振る舞い：価値の比較
  isMoreValuableThan(other: Rarity): boolean {
    return this.config.value > other.config.value;
  }

  // 振る舞い：エフェクト有無の判定
  hasSpecialEffects(): boolean {
    return this.config.value >= 3; // EPICとLEGENDARYはエフェクトあり
  }

  // 振る舞い：確率の取得
  getProbability(): number {
    return this.config.probability;
  }

  // 振る舞い：表示色の取得
  getDisplayColor(): string {
    return this.config.color;
  }

  // 振る舞い：日本語ラベルの取得
  getLabel(): string {
    return this.config.label;
  }
}
```

### ドメインサービス

```typescript
// src/domain/services/OmikujiTypeOrderingService.ts
export class OmikujiTypeOrderingService {
  static sortByPriority(types: OmikujiType[]): OmikujiType[] {
    return [...types].sort((a, b) => a.compareByOrder(b));
  }

  static getRecommendedType(types: OmikujiType[], userContext?: UserContext): OmikujiType {
    const orderedTypes = this.sortByPriority(types);
    
    // デフォルトは先頭のおみくじ（エンジニア運勢）
    return orderedTypes[0];
  }
}

// src/domain/services/RarityCalculatorService.ts
export class RarityCalculatorService {
  static calculateDisplayRarities(): { rarity: Rarity; percentage: string }[] {
    return [
      { rarity: Rarity.COMMON, percentage: '60%' },
      { rarity: Rarity.RARE, percentage: '30%' },
      { rarity: Rarity.EPIC, percentage: '8%' },
      { rarity: Rarity.LEGENDARY, percentage: '2%' }
    ];
  }

  static isRareResult(rarity: Rarity): boolean {
    return rarity.isMoreValuableThan(Rarity.COMMON);
  }
}
```

### リポジトリインターフェース
```typescript
// src/domain/repositories/IOmikujiTypeRepository.ts
export interface IOmikujiTypeRepository {
  findAll(): Promise<OmikujiType[]>;
  findById(id: string): Promise<OmikujiType | null>;
}
```

## APIエンドポイント設計

### おみくじタイプ一覧取得
```typescript
// src/app/api/omikuji/types/route.ts
export async function GET() {
  const useCase = new GetOmikujiTypesUseCase(
    new JsonOmikujiTypeRepository()
  );
  
  const types = await useCase.execute();
  
  return NextResponse.json({
    types: types.map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      icon: type.icon,
      color: type.color
    }))
  });
}
```

## 状態管理設計

### クライアント状態
```typescript
// src/features/omikuji/hooks/useOmikujiSelection.ts
export const useOmikujiSelection = () => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const selectOmikuji = useCallback(async (typeId: string) => {
    setIsTransitioning(true);
    
    // ページ遷移前のアニメーション
    await animatePageExit();
    
    router.push(`/omikuji/${typeId}`);
  }, [router]);

  return { selectOmikuji, isTransitioning };
};
```

## パフォーマンス最適化戦略

### 1. Server Components活用
- 静的コンテンツはServer Componentで実装
- JavaScript バンドルサイズの削減

### 2. 画像最適化
```typescript
// 画像コンポーネント例
<Image
  src="/images/shrine-bg.webp"
  alt="神社の背景"
  width={1920}
  height={1080}
  priority // LCP最適化
  placeholder="blur"
  blurDataURL={shimmerDataUrl}
/>
```

### 3. アニメーション最適化
- `will-change`の適切な使用
- GPUアクセラレーション活用
- `useReducedMotion`でアクセシビリティ対応

## アクセシビリティ実装

### キーボードナビゲーション
```typescript
// src/features/omikuji/components/OmikujiGrid/index.tsx
export const OmikujiGrid = () => {
  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        focusCard(index + 1);
        break;
      case 'ArrowLeft':
        focusCard(index - 1);
        break;
      case 'Enter':
      case ' ':
        selectCard(index);
        break;
    }
  };
};
```

### ARIAラベル実装
```typescript
<section aria-label="おみくじの種類を選択">
  <h2 id="omikuji-types">おみくじを選ぶ</h2>
  <div role="group" aria-labelledby="omikuji-types">
    {omikujiTypes.map((type) => (
      <button
        key={type.id}
        role="button"
        aria-label={`${type.name}を選択`}
        aria-describedby={`desc-${type.id}`}
      >
        {/* カード内容 */}
      </button>
    ))}
  </div>
</section>
```

## エラーハンドリング設計

### エラーハンドリングアーキテクチャ
```
┌─────────────────────────────────────────────┐
│           Global Error Boundary             │
│         (global-error.tsx)                  │
├─────────────────────────────────────────────┤
│         Root Error Boundary                 │
│           (error.tsx)                       │
├─────────────────────────────────────────────┤
│       Application Components                │
│     (Pages, Features, Components)           │
├─────────────────────────────────────────────┤
│         404 Handler                         │
│       (not-found.tsx)                       │
└─────────────────────────────────────────────┘
```

### エラーハンドリングストラテジー

1. **グラニュラーエラーハンドリング**
   - セグメント単位でerror.tsxを配置可能
   - エラーは親セグメントへバブリング
   - 特定機能のエラーを細かく制御

2. **リセット機能の提供**
   - 一時的なエラーからの復旧手段
   - ユーザーにリトライオプションを提供

3. **神社テーマのエラー表現**
   - エラーページでもサービスの世界観を維持
   - ユーモアを交えたエラーメッセージ

### セキュリティ考慮事項
```typescript
// src/utils/error-handler.ts
export function sanitizeError(error: Error): { message: string; digest?: string } {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return {
      message: error.message,
      digest: error.stack
    };
  }
  
  // 本番環境では詳細を隠蔽
  return {
    message: '一時的なエラーが発生しました',
    digest: generateErrorDigest(error)
  };
}
```

## テスト戦略 (t-wada TDD準拠)

### TDD実践方針

t-wadaのTest Driven Development手法に基づき、以下の原則でテスト駆動開発を実施する：

1. **テストファースト**: 実装前に必ずテストを書く
2. **小さなステップ**: 一度に一つのことだけをテストする  
3. **Red-Green-Refactor**: 失敗→成功→リファクタリングのサイクル
4. **振る舞いテスト**: what（何を）ではなく、why（なぜ）をテストする

### ドメインモデルテスト仕様

#### OmikujiTypeエンティティのテスト

```typescript
// src/domain/entities/OmikujiType.test.ts
describe('OmikujiType', () => {
  describe('作成時', () => {
    describe('正常系', () => {
      it('有効なパラメータでおみくじタイプが作成される', () => {
        // Arrange
        const params = {
          id: 'engineer-fortune',
          name: 'エンジニア運勢',
          description: '今日のコーディングを占う',
          icon: '⚡',
          color: { primary: '#3B82F6', secondary: '#1E40AF' },
          sortOrder: 1
        };

        // Act
        const omikujiType = OmikujiType.create(params);

        // Assert
        expect(omikujiType.id.getValue()).toBe('engineer-fortune');
        expect(omikujiType.name).toBe('エンジニア運勢');
        expect(omikujiType.getDisplayName()).toBe('⚡ エンジニア運勢');
      });
    });

    describe('異常系', () => {
      it('無効なIDの場合、InvalidOmikujiTypeIdErrorを投げる', () => {
        // Arrange
        const invalidParams = {
          id: '', // 空文字列
          name: 'エンジニア運勢',
          description: '今日のコーディングを占う',
          icon: '⚡',
          color: { primary: '#3B82F6', secondary: '#1E40AF' },
          sortOrder: 1
        };

        // Act & Assert
        expect(() => OmikujiType.create(invalidParams))
          .toThrow(InvalidOmikujiTypeIdError);
      });

      it('無効なカラーコードの場合、InvalidColorCodeErrorを投げる', () => {
        // Arrange
        const invalidParams = {
          id: 'engineer-fortune',
          name: 'エンジニア運勢',
          description: '今日のコーディングを占う',
          icon: '⚡',
          color: { primary: 'invalid-color', secondary: '#1E40AF' }, // 無効な色
          sortOrder: 1
        };

        // Act & Assert
        expect(() => OmikujiType.create(invalidParams))
          .toThrow(InvalidColorCodeError);
      });
    });
  });

  describe('振る舞い', () => {
    let omikujiType1: OmikujiType;
    let omikujiType2: OmikujiType;

    beforeEach(() => {
      omikujiType1 = OmikujiType.create({
        id: 'engineer-fortune',
        name: 'エンジニア運勢',
        description: '今日のコーディングを占う',
        icon: '⚡',
        color: { primary: '#3B82F6', secondary: '#1E40AF' },
        sortOrder: 1
      });

      omikujiType2 = OmikujiType.create({
        id: 'tech-selection',
        name: '技術選定おみくじ',
        description: '次に学ぶ技術を決める',
        icon: '🎲',
        color: { primary: '#10B981', secondary: '#065F46' },
        sortOrder: 2
      });
    });

    it('表示順序で比較できる', () => {
      // Act
      const comparison = omikujiType1.compareByOrder(omikujiType2);

      // Assert
      expect(comparison).toBe(-1); // omikujiType1が先
    });

    it('同一のIDのおみくじタイプは等しいと判定される', () => {
      // Arrange
      const sameOmikujiType = OmikujiType.create({
        id: 'engineer-fortune', // 同じID
        name: '異なる名前', // 名前が違っても
        description: '異なる説明',
        icon: '🔥',
        color: { primary: '#EF4444', secondary: '#991B1B' },
        sortOrder: 99
      });

      // Act & Assert
      expect(omikujiType1.equals(sameOmikujiType)).toBe(true);
    });

    it('異なるIDのおみくじタイプは等しくないと判定される', () => {
      // Act & Assert
      expect(omikujiType1.equals(omikujiType2)).toBe(false);
    });
  });
});
```

#### OmikujiColorScheme値オブジェクトのテスト

```typescript
// src/domain/valueObjects/OmikujiColorScheme.test.ts
describe('OmikujiColorScheme', () => {
  describe('作成時の検証', () => {
    it('有効なカラーコードでカラースキームが作成される', () => {
      // Arrange
      const params = {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#60A5FA'
      };

      // Act
      const colorScheme = OmikujiColorScheme.create(params);

      // Assert
      expect(colorScheme.isAccessible()).toBe(true);
    });

    it('無効なカラーコード形式でInvalidColorCodeErrorを投げる', () => {
      // Arrange
      const invalidParams = {
        primary: 'blue', // CSS名前は無効
        secondary: '#1E40AF'
      };

      // Act & Assert
      expect(() => OmikujiColorScheme.create(invalidParams))
        .toThrow(InvalidColorCodeError);
    });

    it('コントラスト比が不十分でInsufficientContrastErrorを投げる', () => {
      // Arrange
      const lowContrastParams = {
        primary: '#FFFFFF',
        secondary: '#F0F0F0' // コントラスト比が低い
      };

      // Act & Assert
      expect(() => OmikujiColorScheme.create(lowContrastParams))
        .toThrow(InsufficientContrastError);
    });
  });

  describe('TailwindCSS変換', () => {
    it('HEXカラーを適切なTailwindクラスに変換する', () => {
      // Arrange
      const colorScheme = OmikujiColorScheme.create({
        primary: '#3B82F6',
        secondary: '#1E40AF'
      });

      // Act
      const tailwindClasses = colorScheme.toTailwindClasses();

      // Assert
      expect(tailwindClasses.primary).toBe('bg-[#3B82F6]');
      expect(tailwindClasses.secondary).toBe('bg-[#1E40AF]');
    });
  });
});
```

#### Rarityシステムのテスト

```typescript
// src/domain/valueObjects/Rarity.test.ts
describe('Rarity', () => {
  describe('価値の比較', () => {
    it('LEGENDARYはEPICより価値が高い', () => {
      // Act & Assert
      expect(Rarity.LEGENDARY.isMoreValuableThan(Rarity.EPIC)).toBe(true);
    });

    it('COMMONはRAREより価値が低い', () => {
      // Act & Assert
      expect(Rarity.COMMON.isMoreValuableThan(Rarity.RARE)).toBe(false);
    });
  });

  describe('エフェクト判定', () => {
    it('EPICとLEGENDARYは特別エフェクトを持つ', () => {
      // Act & Assert
      expect(Rarity.EPIC.hasSpecialEffects()).toBe(true);
      expect(Rarity.LEGENDARY.hasSpecialEffects()).toBe(true);
    });

    it('COMMONとRAREは特別エフェクトを持たない', () => {
      // Act & Assert
      expect(Rarity.COMMON.hasSpecialEffects()).toBe(false);
      expect(Rarity.RARE.hasSpecialEffects()).toBe(false);
    });
  });

  describe('確率設定', () => {
    it('すべてのレアリティの確率の合計が100%になる', () => {
      // Arrange
      const rarities = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY];

      // Act
      const totalProbability = rarities.reduce((sum, rarity) => 
        sum + rarity.getProbability(), 0
      );

      // Assert
      expect(totalProbability).toBe(1.0); // 100%
    });
  });
});
```

### ドメインサービステスト

```typescript
// src/domain/services/OmikujiTypeOrderingService.test.ts
describe('OmikujiTypeOrderingService', () => {
  let omikujiTypes: OmikujiType[];

  beforeEach(() => {
    omikujiTypes = [
      createTestOmikujiType({ id: 'deploy-fortune', sortOrder: 5 }),
      createTestOmikujiType({ id: 'engineer-fortune', sortOrder: 1 }),
      createTestOmikujiType({ id: 'debug-fortune', sortOrder: 3 }),
    ];
  });

  describe('優先順位でソート', () => {
    it('sortOrder順に並べ替えられる', () => {
      // Act
      const sorted = OmikujiTypeOrderingService.sortByPriority(omikujiTypes);

      // Assert
      expect(sorted[0].id.getValue()).toBe('engineer-fortune');
      expect(sorted[1].id.getValue()).toBe('debug-fortune');
      expect(sorted[2].id.getValue()).toBe('deploy-fortune');
    });
  });

  describe('推奨タイプの選択', () => {
    it('デフォルトで最も優先度の高いタイプを返す', () => {
      // Act
      const recommended = OmikujiTypeOrderingService.getRecommendedType(omikujiTypes);

      // Assert
      expect(recommended.id.getValue()).toBe('engineer-fortune');
    });
  });
});
```

### テストダブル戦略

#### スタブの使用例
```typescript
// リポジトリのスタブ実装
class StubOmikujiTypeRepository implements IOmikujiTypeRepository {
  constructor(private readonly types: OmikujiType[] = []) {}

  async findAll(): Promise<OmikujiType[]> {
    return Promise.resolve(this.types);
  }

  async findById(id: string): Promise<OmikujiType | null> {
    const found = this.types.find(type => type.id.getValue() === id);
    return Promise.resolve(found || null);
  }
}
```

### UIコンポーネントテスト (React Testing Library)

```typescript
// src/features/omikuji/components/OmikujiCard/OmikujiCard.test.tsx
describe('OmikujiCard', () => {
  const defaultProps = {
    omikujiType: {
      id: 'engineer-fortune',
      name: 'エンジニア運勢',
      description: '今日のコーディングを占う',
      icon: '⚡',
      color: { primary: '#3B82F6', secondary: '#1E40AF' },
      route: '/omikuji/engineer-fortune'
    },
    onSelect: vi.fn()
  };

  describe('表示内容', () => {
    it('おみくじタイプの情報が正しく表示される', () => {
      // Arrange & Act
      render(<OmikujiCard {...defaultProps} />);
      
      // Assert
      expect(screen.getByText('エンジニア運勢')).toBeInTheDocument();
      expect(screen.getByText('今日のコーディングを占う')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('クリック時にonSelectコールバックが呼ばれる', async () => {
      // Arrange
      const onSelect = vi.fn();
      render(<OmikujiCard {...defaultProps} onSelect={onSelect} />);
      
      // Act
      await userEvent.click(screen.getByRole('button'));
      
      // Assert
      expect(onSelect).toHaveBeenCalledWith('engineer-fortune');
    });

    it('キーボードのEnterキーでも選択できる', async () => {
      // Arrange
      const onSelect = vi.fn();
      render(<OmikujiCard {...defaultProps} onSelect={onSelect} />);
      
      // Act
      const card = screen.getByRole('button');
      card.focus();
      await userEvent.keyboard('{Enter}');
      
      // Assert
      expect(onSelect).toHaveBeenCalledWith('engineer-fortune');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIAラベルが設定されている', () => {
      // Arrange & Act
      render(<OmikujiCard {...defaultProps} />);
      
      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'エンジニア運勢を選択');
    });

    it('フォーカス可能である', () => {
      // Arrange & Act
      render(<OmikujiCard {...defaultProps} />);
      
      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabindex', '0');
    });
  });
});
```

### テスト実行戦略

#### 段階的テスト実行
1. **Red Phase**: 失敗するテストを書く
2. **Green Phase**: 最小限の実装でテストを通す  
3. **Refactor Phase**: コードを改善しつつテストは通し続ける

#### カバレッジ目標
- **ドメイン層**: 100%のブランチカバレッジ
- **アプリケーション層**: 95%のブランチカバレッジ
- **プレゼンテーション層**: 85%のブランチカバレッジ

#### テスト命名規約
```
describe('[テスト対象クラス名]', () => {
  describe('[メソッド名/状況]', () => {
    it('[期待される振る舞い]', () => {
      // テスト内容
    });
  });
});
```

## セキュリティ考慮事項

### CSP設定
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

## 要件トレーサビリティマトリクス

| 要件ID | コンポーネント | 実装状況 |
|--------|--------------|---------|
| FR-TOP-001 | HeroSection, ShrineBgVisual, CatchCopy | 設計完了 |
| FR-TOP-002 | OmikujiCard, OmikujiTypeGrid | 設計完了 |
| FR-TOP-003 | RarityPreview, SaisenBox | 設計完了 |
| FR-TOP-004 | OmikujiCard (CTAボタン) | 設計完了 |
| NFR-TOP-001 | 全体アーキテクチャ（Server Components） | 設計完了 |
| NFR-TOP-002 | アクセシビリティ実装全般 | 設計完了 |
| NFR-TOP-003 | レスポンシブデザイン | 設計完了 |
| - | エラーハンドリング基盤 | 設計完了 |

## 実装優先順位

1. **Phase 0**: エラーハンドリング基盤
   - error.tsx、not-found.tsx、global-error.tsxの実装
   - カスタムエラータイプの定義
   - エラーサニタイザーの実装

2. **Phase 1**: 基本構造とServer Components
   - HeroSection実装
   - OmikujiTypeGrid（静的表示）

3. **Phase 2**: インタラクティブ要素
   - OmikujiCard（アニメーション）
   - ページ遷移ロジック

4. **Phase 3**: 追加機能
   - RarityPreview
   - SaisenBox

5. **Phase 4**: 最適化とテスト
   - パフォーマンステスト
   - アクセシビリティ検証
   - エラー監視統合準備