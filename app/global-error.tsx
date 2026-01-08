'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="ja">
      <body>
        <main
          role="main"
          data-testid="global-error-container"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fef3c7',
            padding: '1rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            {/* エラーアイコン */}
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚨</div>

            {/* エラータイトル */}
            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#991b1b',
                marginBottom: '1rem',
              }}
            >
              重大なエラーが発生しました
            </h1>

            {/* エラーメッセージ */}
            <p
              style={{
                color: '#4b5563',
                marginBottom: '2rem',
              }}
            >
              アプリケーションで予期せぬ問題が発生しました。
              ページを再読み込みしてお試しください。
            </p>

            {/* リトライボタン */}
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#d97706',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>🔄</span>
              やり直す
            </button>

            {/* 装飾テキスト */}
            <p
              style={{
                marginTop: '2rem',
                fontSize: '0.875rem',
                color: '#6b7280',
              }}
            >
              ご不便をおかけして申し訳ございません。
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
