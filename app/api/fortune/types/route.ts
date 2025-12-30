/**
 * 運勢タイプ取得API
 * 
 * クライアントサイドから運勢データを取得するためのエンドポイント
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // JSONファイルから運勢データを読み込み
    const filePath = join(process.cwd(), 'data/fortune/fortune-types.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const fortuneData = JSON.parse(fileContent);

    return NextResponse.json(fortuneData);
  } catch (error) {
    console.error('Failed to load fortune data:', error);
    
    // フォールバックデータを返す
    const fallbackData = {
      fortunes: [
        {
          id: "shokichi",
          englishName: "common",
          japaneseName: "小吉",
          description: "少しずつ良いことがありそうです",
          probability: 0.40,
          value: 1,
          color: { primary: "#9CA3AF", secondary: "#6B7280", background: "#F3F4F6" },
          effects: { glow: false, sparkle: false, animation: null }
        },
        {
          id: "kichi",
          englishName: "rare",
          japaneseName: "吉",
          description: "良いことが起こりそうな予感です",
          probability: 0.35,
          value: 2,
          color: { primary: "#3B82F6", secondary: "#1E40AF", background: "#DBEAFE" },
          effects: { glow: false, sparkle: false, animation: null }
        },
        {
          id: "chukichi",
          englishName: "epic",
          japaneseName: "中吉",
          description: "かなり良いことが期待できます",
          probability: 0.20,
          value: 3,
          color: { primary: "#8B5CF6", secondary: "#5B21B6", background: "#E0E7FF" },
          effects: { glow: true, sparkle: true, animation: null }
        },
        {
          id: "daikichi",
          englishName: "legendary",
          japaneseName: "大吉",
          description: "最高の運勢！素晴らしいことが待っています",
          probability: 0.05,
          value: 4,
          color: { primary: "#F59E0B", secondary: "#92400E", background: "#FEF3C7" },
          effects: { glow: true, sparkle: true, animation: "pulse" }
        }
      ]
    };

    return NextResponse.json(fallbackData);
  }
}