import type { Metadata } from 'next';
import { omikujiList } from '@/lib/omikuji-data';
import OmikujiCard from '@/app/components/OmikujiCard';

/**
 * トップページのメタデータ設定
 */
export const metadata: Metadata = {
  title: 'エンジニアおみくじ - 今日の運勢を占おう',
  description: 'ソフトウェアエンジニア向けのおみくじアプリ。業務における運勢を気軽に占えます。',
  openGraph: {
    title: 'エンジニアおみくじ',
    description: 'ソフトウェアエンジニア向けの運勢占い',
    type: 'website',
  },
};

/**
 * トップページコンポーネント
 *
 * Server Componentとして実装し、SSRによる高速な初期表示を実現します。
 * - サービス名と目的の明確な表示
 * - おみくじ一覧のグリッドレイアウト表示
 * - レスポンシブデザイン（デスクトップ: 3列、モバイル: 1列）
 * - セマンティックHTML構造
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* ヘッダーセクション */}
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            エンジニアおみくじ
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            ソフトウェアエンジニア向けの運勢占い。
            <br />
            今日の業務運をチェックして、良い一日を過ごしましょう！
          </p>
          {/* エンジニア特化デザイン要素 */}
          <div className="mt-6 inline-block px-6 py-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <code className="text-sm font-mono text-blue-800 dark:text-blue-200">
              {'> fortune.engineer()'}
            </code>
          </div>
        </header>

        {/* おみくじ一覧セクション */}
        <section aria-label="おみくじ一覧">
          {omikujiList.length > 0 ? (
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                {omikujiList.map((omikuji) => (
                  <OmikujiCard
                    key={omikuji.id}
                    id={omikuji.id}
                    name={omikuji.name}
                    description={omikuji.description}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                準備中です。しばらくお待ちください。
              </p>
            </div>
          )}
        </section>

        {/* フッターセクション */}
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>気軽におみくじを引いて、今日の運勢を占ってみましょう</p>
        </footer>
      </main>
    </div>
  );
}
