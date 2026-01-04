/**
 * トップページ - コンポーネント統合実装
 * 
 * タスク12: 全コンポーネントの統合
 * TDD Green Phase: テストを通すための統合実装
 */

'use client';

import React from 'react';

// JSONデータベースを使った運勢プレビューコンポーネント
const RarityPreview = () => {
  const [fortunes, setFortunes] = React.useState<Array<{
    id: string;
    japaneseName: string;
    probability: number;
    color: { primary: string };
    effects: { glow: boolean; sparkle: boolean };
  }>>([]);

  React.useEffect(() => {
    const loadFortunes = async () => {
      try {
        const response = await fetch('/api/fortune/types');
        const data = await response.json();
        
        const activeFortunes = data.fortunes
          .filter((fortune: any) => !fortune.disabled)
          .sort((a: any, b: any) => a.value - b.value); // 価値順でソート
        
        setFortunes(activeFortunes);
      } catch (error) {
        console.error('Failed to load fortunes:', error);
        // フォールバックデータ
        setFortunes([
          { id: 'daikyo', japaneseName: '大凶', probability: 0.12, color: { primary: '#991B1B' }, effects: { glow: false, sparkle: false } },
          { id: 'kyo', japaneseName: '凶', probability: 0.15, color: { primary: '#DC2626' }, effects: { glow: false, sparkle: false } },
          { id: 'shokichi', japaneseName: '小吉', probability: 0.30, color: { primary: '#9CA3AF' }, effects: { glow: false, sparkle: false } },
          { id: 'kichi', japaneseName: '吉', probability: 0.25, color: { primary: '#3B82F6' }, effects: { glow: false, sparkle: false } },
          { id: 'chukichi', japaneseName: '中吉', probability: 0.15, color: { primary: '#8B5CF6' }, effects: { glow: true, sparkle: true } },
          { id: 'daikichi', japaneseName: '大吉', probability: 0.03, color: { primary: '#F59E0B' }, effects: { glow: true, sparkle: true } }
        ]);
      }
    };

    loadFortunes();
  }, []);

  return (
    <div data-testid="rarity-preview" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {fortunes.map((fortune) => (
          <div
            key={fortune.id}
            className={`p-3 rounded-lg text-center fortune-${fortune.id} ${fortune.effects.glow ? 'animate-glow' : ''} ${fortune.effects.sparkle ? 'animate-sparkle' : ''}`}
            style={{ borderColor: fortune.color.primary, borderWidth: '2px' }}
          >
            <div className="font-bold text-sm" style={{ color: fortune.color.primary }}>
              {fortune.japaneseName}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {fortune.id === 'daikichi' && '✨ 稀なり ✨'}
              {fortune.id === 'chukichi' && '🌟 時々'}
              {fortune.id === 'kichi' && '🌸 よくあり'}
              {fortune.id === 'shokichi' && '🍃 よくあり'}
              {fortune.id === 'kyo' && '⚠️ 注意'}
              {fortune.id === 'daikyo' && '💀 極稀'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SaisenSelector = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto">
    <div className="text-center mb-4">
      <div className="text-4xl mb-2">📦</div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        お気持ちをお納めください
      </h3>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {[
        { amount: 5, label: '5円', effect: 'ご縁' },
        { amount: 50, label: '50円', effect: '小吉以上+5%' },
        { amount: 100, label: '100円', effect: 'レア以上+10%' },
        { amount: 500, label: '500円', effect: 'エピック以上+15%' }
      ].map((option) => (
        <button
          key={option.amount}
          className="p-3 rounded-lg border-2 border-gray-200 hover:border-indigo-300 text-center transition-all"
          aria-label={`${option.label}のお賽銭を選択`}
        >
          <div className="font-bold text-lg">{option.label}</div>
          <div className="text-xs text-gray-500">{option.effect}</div>
        </button>
      ))}
    </div>
  </div>
);

const OmikujiTypeGrid = () => {
  const omikujiTypes = [
    { 
      id: 'engineer-fortune', 
      name: 'エンジニア運勢', 
      description: '今日のコーディングを占う', 
      icon: '⚡',
      color: { primary: '#6366f1', secondary: '#4f46e5' }
    },
    { 
      id: 'tech-selection', 
      name: '技術選定おみくじ', 
      description: '次に学ぶ技術を決める', 
      icon: '🎲',
      color: { primary: '#8b5cf6', secondary: '#7c3aed' }
    },
    { 
      id: 'debug-fortune', 
      name: 'デバッグ運', 
      description: 'バグ解決のヒントを得る', 
      icon: '🐛',
      color: { primary: '#10b981', secondary: '#059669' }
    },
    { 
      id: 'code-review-fortune', 
      name: 'コードレビュー運', 
      description: 'レビューの結果を予想', 
      icon: '👀',
      color: { primary: '#f59e0b', secondary: '#d97706' }
    },
    { 
      id: 'deploy-fortune', 
      name: 'デプロイ運', 
      description: 'デプロイの成功を占う', 
      icon: '🚀',
      color: { primary: '#ef4444', secondary: '#dc2626' }
    }
  ];

  const [isDrawing, setIsDrawing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any>(null);
  const [showResult, setShowResult] = React.useState(false);

  const handleCardSelect = async (typeId: string) => {
    try {
      setIsDrawing(true);
      setError(null);

      const response = await fetch('/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          omikujiType: typeId,
          monetaryAmount: 0,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'おみくじを引くことができませんでした');
      }

      setResult(data.result);
      setShowResult(true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'おみくじを引くことができませんでした';
      setError(errorMessage);
    } finally {
      setIsDrawing(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setResult(null);
  };

  if (showResult && result) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
          <button
            onClick={handleCloseResult}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="結果を閉じる"
          >
            ×
          </button>
          
          {/* 運勢結果 */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎊</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {result.fortune.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {result.fortune.description}
            </p>
          </div>

          {/* タイトルフレーズ */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
              今日のメッセージ
            </h3>
            <p className="text-lg text-gray-800 dark:text-gray-200 text-center leading-relaxed">
              {result.omikujiResult.titlePhrase.value}
            </p>
          </div>

          {/* 説明 */}
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {result.omikujiResult.description.value}
            </p>
          </div>

          {/* カテゴリ別運勢 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {result.omikujiResult.categories.items.map((category: any, index: number) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    category.emotionTone === 'positive' ? 'bg-green-400' :
                    category.emotionTone === 'negative' ? 'bg-red-400' : 'bg-yellow-400'
                  }`}></div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {category.content}
                </p>
              </div>
            ))}
          </div>

          {/* アクションボタン */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleCloseResult}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              別のおみくじを引く
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDrawing) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div role="status" aria-label="おみくじを引いています" className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <div className="text-center mt-4 text-gray-600">おみくじを引いています...</div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="omikuji-type-grid">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 font-semibold">エラー</div>
          <div className="text-red-700">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            閉じる
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {omikujiTypes.map((type) => (
          <div
            key={type.id}
            data-testid={`omikuji-card-${type.id}`}
            className="omikuji-card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-200"
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">{type.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{type.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{type.description}</p>
            </div>
            <button
              onClick={() => handleCardSelect(type.id)}
              disabled={isDrawing}
              className="w-full py-3 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label={`${type.name}を選択`}
            >
              このおみくじを引く
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 簡易HeroSectionコンポーネント
const HeroSection = ({ catchCopy, backgroundVariant }: { catchCopy: { main: string; sub: string }, backgroundVariant?: string }) => (
  <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600">
    <div className="relative mx-auto max-w-7xl text-center">
      <div className="mb-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-3xl">⛩️</span>
        </div>
      </div>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
        {catchCopy.main}
      </h1>
      <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
        {catchCopy.sub}
      </p>
      <div className="flex justify-center items-center space-x-8 mb-8">
        <div className="hidden sm:block text-white/60">
          <span className="text-sm font-mono">{'{ code: "fortune" }'}</span>
        </div>
        <div className="text-white/80">
          <span className="text-lg">✨</span>
        </div>
        <div className="hidden sm:block text-white/60">
          <span className="text-sm font-mono">{'console.log("luck");'}</span>
        </div>
      </div>
    </div>
  </section>
);

export default function TopPage() {
  return (
    <>
      {/* メインコンテンツ */}
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* ヒーローセクション */}
        <header role="banner" className="relative overflow-hidden">
          <HeroSection 
            catchCopy={{
              main: "エンジニアの運命を占う",
              sub: "今日のコーディング運は？"
            }}
            backgroundVariant="default"
          />
        </header>

        {/* メインコンテンツエリア */}
        <main role="main" className="relative px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            
            {/* おみくじ選択セクション */}
            <section className="mb-12" aria-labelledby="omikuji-selection">
              <div className="text-center mb-8">
                <h2 id="omikuji-selection" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  おみくじを選ぶ
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  気になるおみくじを選んで、運命を占いましょう
                </p>
              </div>

              <OmikujiTypeGrid />
            </section>

            {/* レアリティプレビュー */}
            <section className="mb-12" aria-labelledby="rarity-section">
              <div className="text-center mb-6">
                <h2 id="rarity-section" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  期待できる運勢
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  大吉が出るかも？
                </p>
              </div>
              
              <RarityPreview />
            </section>

            {/* お賽銭システム */}
            <section className="mb-12" aria-labelledby="saisen-section">
              <div className="text-center mb-6">
                <h2 id="saisen-section" className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  お賽銭で運気UP
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  より良い結果を得るために、お気持ちをお納めください
                </p>
              </div>
              
              <SaisenSelector />
            </section>

            {/* フッターセクション */}
            <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>エンジニアの日常に楽しみと気づきを</p>
                <p className="mt-1">© 2024 Engineer Omikuji Service</p>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </>
  );
}