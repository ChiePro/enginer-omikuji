/**
 * おみくじ抽選API
 * 
 * POST /api/omikuji/draw
 * おみくじタイプとお賽銭レベルを受け取り、おみくじ結果を返す
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface OmikujiDrawRequest {
  omikujiType: string;
  monetaryAmount?: number;
  typeId?: string;
  saisenLevel?: number;
}

interface OmikujiDrawResponse {
  success: boolean;
  result?: {
    fortune: {
      id: string;
      name: string;
      description: string;
      rank: number;
    };
    omikujiResult: {
      id: { value: string };
      titlePhrase: { value: string };
      description: { value: string };
      emotionAttribute: string;
      categories: { items: any[] };
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

const VALID_OMIKUJI_TYPES = [
  'engineer-fortune',
  'tech-selection', 
  'debug-fortune',
  'code-review-fortune',
  'deploy-fortune'
];

const FORTUNE_TYPES = [
  { id: 'daikichi', name: '大吉', description: '最高の運勢です', rank: 1 },
  { id: 'chukichi', name: '中吉', description: 'かなり良い運勢です', rank: 2 },
  { id: 'kichi', name: '吉', description: '良い運勢です', rank: 3 },
  { id: 'shokichi', name: '小吉', description: '少し良い運勢です', rank: 4 },
  { id: 'suekichi', name: '末吉', description: '後で良くなる運勢です', rank: 5 },
  { id: 'kyo', name: '凶', description: '注意が必要な運勢です', rank: 6 },
  { id: 'daikyo', name: '大凶', description: 'とても注意が必要な運勢です', rank: 7 }
];

function getRandomFortune() {
  // 確率重み付き抽選
  const weights = [0.03, 0.15, 0.25, 0.30, 0.15, 0.10, 0.02]; // 大吉から大凶まで
  const random = Math.random();
  let accumulator = 0;
  
  for (let i = 0; i < weights.length; i++) {
    accumulator += weights[i];
    if (random <= accumulator) {
      return FORTUNE_TYPES[i];
    }
  }
  
  return FORTUNE_TYPES[3]; // フォールバック: 小吉
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
  return {
    id: `${omikujiType}-${fortuneId}-fallback-${Date.now()}`,
    titlePhrase: 'エンジニアの運命は、コードと共に歩む！',
    description: '今日は新しい技術への挑戦が実を結ぶ日。困難なバグも、あなたの知識とひらめきで必ず解決できるでしょう。チームとのコラボレーションを大切にし、学び続ける姿勢を忘れずに。',
    emotionAttribute: 'positive',
    categories: [
      { name: '恋愛運', content: 'ペアプログラミングで素敵な出会いが', emotionTone: 'positive' },
      { name: '仕事運', content: 'コードレビューで評価が上がります', emotionTone: 'positive' },
      { name: '健康運', content: '適度な休憩を心がけましょう', emotionTone: 'neutral' },
      { name: '金運', content: '技術投資が将来の収益につながります', emotionTone: 'positive' },
      { name: '学業運', content: '新しいフレームワークの習得が進みます', emotionTone: 'positive' }
    ]
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<OmikujiDrawResponse>> {
  try {
    const body = await request.json() as OmikujiDrawRequest;
    
    // Support both new and legacy request formats
    const omikujiType = body.omikujiType || body.typeId;
    
    if (!omikujiType) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Omikuji type is required'
        }
      }, { status: 400 });
    }
    
    if (!VALID_OMIKUJI_TYPES.includes(omikujiType)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid omikuji type. Valid types: ${VALID_OMIKUJI_TYPES.join(', ')}`
        }
      }, { status: 400 });
    }
    
    // Draw fortune
    const fortune = getRandomFortune();
    
    // Load omikuji result
    let omikujiResult = loadOmikujiResult(omikujiType, fortune.id);
    
    // Use fallback if no result found
    if (!omikujiResult) {
      omikujiResult = createFallbackResult(omikujiType, fortune.id);
    }
    
    const response: OmikujiDrawResponse = {
      success: true,
      result: {
        fortune: {
          id: fortune.id,
          name: fortune.name,
          description: fortune.description,
          rank: fortune.rank
        },
        omikujiResult: {
          id: { value: omikujiResult.id },
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