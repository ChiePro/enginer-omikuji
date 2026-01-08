'use client';

import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  return (
    <main
      role="main"
      data-testid="error-container"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-orange-100 px-4"
    >
      <div className="text-center max-w-md">
        {/* エラーアイコン */}
        <div className="text-6xl mb-6">⚠️</div>

        {/* エラータイトル */}
        <h1 className="text-3xl font-bold text-red-800 mb-4">
          エラーが発生しました
        </h1>

        {/* エラーメッセージ */}
        <p className="text-gray-600 mb-8">
          申し訳ありません。予期せぬエラーが発生しました。
          もう一度お試しいただくか、トップページへお戻りください。
        </p>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* リトライボタン */}
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200 shadow-md"
          >
            <span className="mr-2">🔄</span>
            やり直す
          </button>

          {/* トップページリンク */}
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md"
          >
            <span className="mr-2">🏠</span>
            トップページへ
          </Link>
        </div>

        {/* 装飾テキスト */}
        <p className="mt-8 text-sm text-gray-500">
          ご不便をおかけして申し訳ございません。
        </p>
      </div>
    </main>
  );
}
