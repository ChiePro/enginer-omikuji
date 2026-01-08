import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      role="main"
      data-testid="not-found-container"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 px-4"
    >
      <div className="text-center max-w-md">
        {/* 神社風アイコン */}
        <div className="text-6xl mb-6">⛩️</div>

        {/* 404表示 */}
        <h1 className="text-6xl font-bold text-amber-800 mb-4">404</h1>

        {/* エラーメッセージ */}
        <p className="text-xl text-amber-700 mb-2">ページが見つかりません</p>
        <p className="text-gray-600 mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>

        {/* トップページへのリンク */}
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200 shadow-md"
        >
          <span className="mr-2">🏠</span>
          トップページへ戻る
        </Link>

        {/* 装飾 */}
        <p className="mt-8 text-sm text-gray-500">
          迷い道も、また一興。
        </p>
      </div>
    </main>
  );
}
