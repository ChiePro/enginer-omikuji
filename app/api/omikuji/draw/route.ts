/**
 * おみくじ抽選API
 * 
 * POST /api/omikuji/draw
 * おみくじタイプとお賽銭レベルを受け取り、おみくじ結果を返す
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CategoryRandomizationService } from '../../../../src/domain/services/CategoryRandomizationService';
import { CategoryContentPoolService } from '../../../../src/domain/services/CategoryContentPoolService';
import { SessionDuplicationGuardService } from '../../../../src/domain/services/SessionDuplicationGuardService';
import { EnhancedEmotionAttributeCalculator } from '../../../../src/domain/services/EnhancedEmotionAttributeCalculator';
import { JsonCategoryPoolRepository } from '../../../../src/infrastructure/repositories/json/JsonCategoryPoolRepository';
import { InMemorySessionStore } from '../../../../src/infrastructure/session/InMemorySessionStore';
import { Fortune } from '../../../../src/domain/valueObjects/Fortune';
import { OmikujiDrawRequest, OmikujiDrawResponse } from './types';

const VALID_OMIKUJI_TYPES = [
  'engineer-fortune',
  'tech-selection', 
  'debug-fortune',
  'code-review-fortune',
  'deploy-fortune'
];

// Initialize randomization services (create new instance each time to avoid caching)
function initializeRandomizationServices() {
  const poolRepository = new JsonCategoryPoolRepository();
  const poolService = new CategoryContentPoolService(poolRepository);
  const sessionGuardService = new SessionDuplicationGuardService(new InMemorySessionStore());
  const emotionCalculator = new EnhancedEmotionAttributeCalculator();
  
  return new CategoryRandomizationService(
    poolService,
    sessionGuardService,
    emotionCalculator
  );
}

const FORTUNE_TYPES = [
  { id: 'daikichi', name: '大吉', description: '最高の運勢です', rank: 1, value: 4, probability: 0.03 },
  { id: 'chukichi', name: '中吉', description: 'かなり良い運勢です', rank: 2, value: 3, probability: 0.15 },
  { id: 'kichi', name: '吉', description: '良い運勢です', rank: 3, value: 2, probability: 0.25 },
  { id: 'shokichi', name: '小吉', description: '少し良い運勢です', rank: 4, value: 1, probability: 0.30 },
  { id: 'suekichi', name: '末吉', description: '後で良くなる運勢です', rank: 5, value: 0, probability: 0.15 },
  { id: 'kyo', name: '凶', description: '注意が必要な運勢です', rank: 6, value: -1, probability: 0.10 },
  { id: 'daikyo', name: '大凶', description: 'とても注意が必要な運勢です', rank: 7, value: -2, probability: 0.02 }
];

function validateSessionId(sessionId?: string): boolean {
  if (sessionId === undefined) return true; // Optional parameter
  if (typeof sessionId !== 'string' || sessionId.trim() === '') return false;
  return true;
}

function getRandomFortune(seed?: string) {
  // Use deterministic randomization if seed is provided
  let random: number;
  if (seed) {
    // Simple deterministic random based on seed + timestamp to ensure uniqueness
    const uniqueSeed = seed + Date.now() + Math.random();
    let hash = 0;
    for (let i = 0; i < uniqueSeed.length; i++) {
      const char = uniqueSeed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    random = Math.abs(hash) / Math.pow(2, 31);
  } else {
    // Always generate fresh random number
    random = Math.random();
  }
  
  // 確率重み付き抽選
  const weights = [0.03, 0.15, 0.25, 0.30, 0.15, 0.10, 0.02]; // 大吉から大凶まで
  let accumulator = 0;
  
  for (let i = 0; i < weights.length; i++) {
    accumulator += weights[i];
    if (random <= accumulator) {
      return FORTUNE_TYPES[i];
    }
  }
  
  return FORTUNE_TYPES[3]; // フォールバック: 小吉
}

function createFortuneFromType(fortuneType: typeof FORTUNE_TYPES[0]): Fortune {
  return Fortune.fromData({
    id: fortuneType.id,
    englishName: fortuneType.name,
    japaneseName: fortuneType.name,
    description: fortuneType.description,
    probability: fortuneType.probability,
    value: fortuneType.value,
    color: { primary: '#000000', secondary: '#ffffff', background: '#f0f0f0' },
    effects: { glow: false, sparkle: false, animation: null }
  });
}

async function getRandomizedCategories(
  fortune: Fortune, 
  omikujiType: string, 
  sessionId?: string, 
  seed?: string
): Promise<any[]> {
  try {
    const service = initializeRandomizationServices();
    const result = await service.randomizeCategories(fortune, omikujiType, sessionId, seed);
    
    if (result.success) {
      console.log('Randomization service success:', result.data.length, 'categories');
      // Convert FortuneCategory[] to the API response format
      return result.data.map((category: any) => ({
        name: category.getDisplayName(),
        content: category.getFortuneLevel(),
        emotionTone: category.emotionAttribute || 'neutral'
      }));
    } else {
      console.error('Randomization service failed:', result.error);
    }
  } catch (error) {
    console.error('Randomization service error:', error);
  }
  
  console.log('Using fallback randomized content for:', omikujiType, fortune.getId());
  // Fallback to randomized static content
  return createRandomizedFallbackResult(omikujiType, fortune.getId()).categories;
}

function loadOmikujiResult(omikujiType: string, fortuneId: string) {
  try {
    const filePath = join(process.cwd(), 'data', 'results', `${omikujiType}.json`);
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    const results = data.results[fortuneId];
    if (results && results.length > 0) {
      // ランダムに結果を選択
      const randomIndex = Math.floor(Math.random() * results.length);
      return results[randomIndex];
    }
  } catch (error) {
    console.error(`Failed to load result for ${omikujiType}/${fortuneId}:`, error);
  }
  
  return null;
}

function createFallbackResult(omikujiType: string, fortuneId: string) {
  // Use the same randomization as the new function  
  return createRandomizedFallbackResult(omikujiType, fortuneId);
}

/**
 * 運勢値に基づいて感情属性を確率的に選択
 * EmotionAttributeDistribution.forFortuneLevelと同じロジック
 */
function selectEmotionForFortune(fortuneId: string): 'positive' | 'neutral' | 'negative' {
  const fortuneValues: { [key: string]: number } = {
    'daikichi': 4,   // 大吉: positive 100%
    'chukichi': 3,   // 中吉: positive 80%, neutral 15%, negative 5%
    'kichi': 2,      // 吉: positive 60%, neutral 30%, negative 10%
    'shokichi': 1,   // 小吉: positive 60%, neutral 30%, negative 10%
    'suekichi': 0,   // 末吉: positive 30%, neutral 50%, negative 20%
    'kyo': -1,       // 凶: positive 15%, neutral 25%, negative 60%
    'daikyo': -2     // 大凶: negative 100%
  };

  const value = fortuneValues[fortuneId] ?? 1;
  const random = Math.random();

  if (value >= 4) {
    return 'positive'; // 大吉は100% positive
  } else if (value >= 3) {
    // 中吉: 80% positive, 15% neutral, 5% negative
    if (random < 0.80) return 'positive';
    if (random < 0.95) return 'neutral';
    return 'negative';
  } else if (value >= 1) {
    // 吉/小吉: 60% positive, 30% neutral, 10% negative
    if (random < 0.60) return 'positive';
    if (random < 0.90) return 'neutral';
    return 'negative';
  } else if (value === 0) {
    // 末吉: 30% positive, 50% neutral, 20% negative
    if (random < 0.30) return 'positive';
    if (random < 0.80) return 'neutral';
    return 'negative';
  } else if (value <= -2) {
    return 'negative'; // 大凶は100% negative
  } else {
    // 凶: 15% positive, 25% neutral, 60% negative
    if (random < 0.15) return 'positive';
    if (random < 0.40) return 'neutral';
    return 'negative';
  }
}

function createRandomizedFallbackResult(omikujiType: string, fortuneId: string) {
  // 感情属性別にメッセージを分離（色と内容が一致するように）
  const categoryVariationsByEmotion = {
    '恋愛運': {
      positive: [
        'ペアプログラミングで素敵な出会いが',
        'GitHubのフォロワーから良い知らせ',
        'コードレビューで好印象を与えられる'
      ],
      neutral: [
        'いつも通りのコミュニケーションを大切に',
        'オンラインでの交流は穏やかに進む',
        'チームワークは安定している'
      ],
      negative: [
        'コミュニケーション不足に注意が必要',
        'ペアプロでの意見の相違に気をつけて',
        '誤解を招きやすい時期、慎重に'
      ]
    },
    '仕事運': {
      positive: [
        'コードレビューで評価が上がります',
        '新機能のデプロイが成功します',
        'バグ修正で大きな感謝を得ます'
      ],
      neutral: [
        '着実なタスク進行が期待できます',
        '通常のコーディング業務、安定した日',
        '地道な作業が実を結ぶ'
      ],
      negative: [
        'デプロイ時にトラブルの可能性あり',
        '予期しないバグに遭遇しそう',
        '慎重なデバッグが必要な日'
      ]
    },
    '健康運': {
      positive: [
        '集中力MAX、生産性の高い一日',
        '良い椅子との出会い、姿勢改善',
        '適度な休憩で心身ともに好調'
      ],
      neutral: [
        '適度な休憩を心がけましょう',
        'ストレッチで肩こり予防を',
        '規則正しい生活を意識して'
      ],
      negative: [
        '長時間作業で疲労がたまりそう',
        '眼精疲労に注意が必要',
        'ストレス過多に気をつけて'
      ]
    },
    '金運': {
      positive: [
        '技術投資が将来の収益につながります',
        '新しいスキルで昇進のチャンス',
        '副業案件の良い話が舞い込む'
      ],
      neutral: [
        '堅実な技術投資を続けましょう',
        '収支は安定、大きな変動なし',
        'スキルアップへの投資は吉'
      ],
      negative: [
        '技術書の衝動買いに注意',
        '思わぬ出費が発生しそう',
        '機材トラブルで予想外の支出'
      ]
    },
    '学業運': {
      positive: [
        '新しいフレームワークの習得が進みます',
        'アルゴリズムの理解が深まる',
        '設計パターンの学習に最適な日'
      ],
      neutral: [
        '着実な学習の継続が大切',
        'ドキュメント読みは順調に進む',
        '基礎固めに良い日'
      ],
      negative: [
        '難しい概念に苦戦しそう',
        '学習意欲が低下しがち',
        '複雑な問題の理解に時間がかかる'
      ]
    }
  };

  // 運勢に基づいた感情属性を決定（各カテゴリで独立に決定）
  const categories = Object.entries(categoryVariationsByEmotion).map(([categoryName, emotionVariations]) => {
    const selectedEmotion = selectEmotionForFortune(fortuneId);
    const variations = emotionVariations[selectedEmotion];
    const randomContent = variations[Math.floor(Math.random() * variations.length)];

    return {
      name: categoryName,
      content: randomContent,
      emotionTone: selectedEmotion
    };
  });

  const uniqueId = `${omikujiType}-${fortuneId}-randomized-fallback-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // 全体の感情属性も運勢に基づいて決定
  const overallEmotion = selectEmotionForFortune(fortuneId);

  return {
    id: uniqueId,
    titlePhrase: 'エンジニアの運命は、コードと共に歩む！',
    description: '今日は新しい技術への挑戦が実を結ぶ日。困難なバグも、あなたの知識とひらめきで必ず解決できるでしょう。チームとのコラボレーションを大切にし、学び続ける姿勢を忘れずに。',
    emotionAttribute: overallEmotion,
    categories: categories
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<OmikujiDrawResponse>> {
  let body: OmikujiDrawRequest;
  
  try {
    body = await request.json() as OmikujiDrawRequest;
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body'
      }
    }, { status: 400 });
  }
  
  try {
    
    // Support both new and legacy request formats
    const omikujiType = body.omikujiType || body.typeId;
    const sessionId = body.sessionId;
    const seed = body.seed;
    
    if (!omikujiType) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'typeId is required'
        }
      }, { status: 400 });
    }
    
    if (!VALID_OMIKUJI_TYPES.includes(omikujiType)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORTUNE_DATA_NOT_FOUND',
          message: `Invalid omikuji typeId. Valid types: ${VALID_OMIKUJI_TYPES.join(', ')}`
        }
      }, { status: 404 });
    }

    // Validate sessionId if provided
    if (!validateSessionId(sessionId)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'sessionId must be a non-empty string if provided'
        }
      }, { status: 400 });
    }

    // Validate saisenLevel if provided
    if (body.saisenLevel !== undefined && (body.saisenLevel < 0 || body.saisenLevel > 5)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'saisenLevel must be between 0 and 5'
        }
      }, { status: 400 });
    }
    
    // Draw fortune
    const fortuneType = getRandomFortune(seed);
    const fortune = createFortuneFromType(fortuneType);
    
    // Get randomized categories (with fallback to static content)
    const categories = await getRandomizedCategories(fortune, omikujiType, sessionId, seed);
    
    // Load base omikuji result for title and description
    let omikujiResult = loadOmikujiResult(omikujiType, fortuneType.id);
    
    // Use fallback if no result found
    if (!omikujiResult) {
      omikujiResult = createFallbackResult(omikujiType, fortuneType.id);
    }

    // Override categories with randomized ones
    omikujiResult.categories = categories;
    
    // Ensure unique response ID 
    const uniqueResponseId = `${omikujiType}-${fortuneType.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    const response: any = {
      success: true,
      data: {
        id: uniqueResponseId,
        omikujiType: {
          id: omikujiType,
          name: omikujiType,
          description: `${omikujiType} omikuji`,
          icon: '',
          color: {
            primary: '#000000',
            secondary: '#ffffff'
          }
        },
        fortune: {
          id: fortuneType.id,
          japaneseName: fortuneType.name,
          englishName: fortuneType.name,
          description: fortuneType.description,
          value: fortuneType.value,
          probability: fortuneType.probability
        },
        createdAt: new Date().toISOString()
      },
      // Also include the detailed result structure for backward compatibility
      result: {
        fortune: {
          id: fortuneType.id,
          name: fortuneType.name,
          description: fortuneType.description,
          rank: fortuneType.rank
        },
        omikujiResult: {
          id: { value: uniqueResponseId },
          titlePhrase: { value: omikujiResult.titlePhrase },
          description: { value: omikujiResult.description },
          emotionAttribute: omikujiResult.emotionAttribute,
          categories: { items: omikujiResult.categories }
        }
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Omikuji draw API error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
}