/**
 * ヒーローセクションコンポーネント
 * 
 * 神社×テクノロジーの融合ビジュアルを表現するヒーローセクション
 */

import React from 'react';
import Image from 'next/image';

export interface HeroSectionProps {
  catchCopy: {
    main: string;
    sub: string;
  };
  backgroundVariant?: 'default' | 'festival' | 'night';
}

const HeroSection: React.FC<HeroSectionProps> = ({
  catchCopy,
  backgroundVariant = 'default'
}) => {
  const backgroundClasses = {
    default: 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600',
    festival: 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500',
    night: 'bg-gradient-to-r from-blue-900 via-purple-900 to-black'
  };

  return (
    <section className={`relative py-20 px-4 sm:px-6 lg:px-8 ${backgroundClasses[backgroundVariant]}`}>
      {/* 背景パターン */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cg%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%224%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] bg-repeat" />
      </div>

      <div className="relative mx-auto max-w-7xl text-center">
        {/* 神社アイコン */}
        <div className="mb-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-3xl">⛩️</span>
          </div>
        </div>

        {/* メインコピー */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
          {catchCopy.main}
        </h1>

        {/* サブコピー */}
        <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
          {catchCopy.sub}
        </p>

        {/* 装飾要素 */}
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

        {/* スクロール促進インジケーター */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <svg
              className="h-6 w-6 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 浮遊する要素 */}
      <div className="absolute top-1/4 left-4 text-white/30 animate-float-slow">
        <span className="text-2xl">&lt;/&gt;</span>
      </div>
      <div className="absolute top-1/3 right-8 text-white/30 animate-float-medium">
        <span className="text-xl">🔮</span>
      </div>
      <div className="absolute bottom-1/4 left-8 text-white/30 animate-float-fast">
        <span className="text-lg">⚡</span>
      </div>
    </section>
  );
};

export default HeroSection;