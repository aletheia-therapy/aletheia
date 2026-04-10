'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  const router = useRouter();
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  const intents = [
    {
      id: 'explore',
      title: '探索',
      icon: '🔮',
      description: '深入內心的宇宙，探索潛意識的星海',
      color: 'from-purple-500/30 to-pink-500/30',
      hoverColor: 'hover:from-purple-500/50 hover:to-pink-500/50',
    },
    {
      id: 'solve',
      title: '解決',
      icon: '🎯',
      description: '面對具體困境，尋找實際的行動方案',
      color: 'from-blue-500/30 to-cyan-500/30',
      hoverColor: 'hover:from-blue-500/50 hover:to-cyan-500/50',
    },
    {
      id: 'understand',
      title: '理解',
      icon: '🧠',
      description: '認識真實的自己，理解行為背後的意義',
      color: 'from-amber-500/30 to-orange-500/30',
      hoverColor: 'hover:from-amber-500/50 hover:to-orange-500/50',
    },
  ];

  const handleSelectIntent = (intentId: string) => {
    setSelectedIntent(intentId);
    setTimeout(() => {
      router.push(`/therapy?intent=${intentId}`);
    }, 300);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
      <CosmicBackground emotion="平靜" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        
        {/* 標題區 - 簡潔 */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-light text-white mb-3 tracking-wider">
            Aletheia 阿勒希雅
          </h1>
          <p className="text-lg text-white/60">
            首席AI心理師 · 真理之境
          </p>
        </div>

        {/* 核心：意圖選擇 - 超大、居中 */}
        <div className="w-full max-w-6xl mb-16">
          <h2 className="text-center text-white text-2xl font-light mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            選擇你此刻的意圖
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {intents.map((intent, index) => (
              <button
                key={intent.id}
                onClick={() => handleSelectIntent(intent.id)}
                className={`
                  group relative p-12 rounded-3xl backdrop-blur-md
                  bg-gradient-to-br ${intent.color}
                  border-2 border-white/20
                  ${intent.hoverColor}
                  transition-all duration-300
                  ${selectedIntent === intent.id ? 'scale-105 border-white/40 shadow-2xl' : 'hover:scale-105 hover:shadow-2xl'}
                  animate-fade-in
                `}
                style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 text-center">
                  <div className="text-7xl mb-6">{intent.icon}</div>
                  <h3 className="text-3xl font-light text-white mb-4">
                    {intent.title}
                  </h3>
                  <p className="text-base text-white/70 leading-relaxed">
                    {intent.description}
                  </p>
                </div>

                {selectedIntent === intent.id && (
                  <div className="absolute top-6 right-6">
                    <div className="w-4 h-4 rounded-full bg-white animate-pulse shadow-lg" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-white/40 text-sm mt-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            你的選擇會影響 Aletheia 與你對話的方式
          </p>
        </div>

        {/* 測試說明 - 簡化、淡化 */}
        <div className="w-full max-w-2xl mb-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 px-6 py-4">
            <div className="flex items-center justify-center space-x-8 text-center">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">限時免費測試</p>
                <p className="text-white/50 text-xs">每次對話 15 則訊息</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">完全免費</p>
                <p className="text-white/50 text-xs">測試期間不收費</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">隱私保護</p>
                <p className="text-white/50 text-xs">你的資料完全安全</p>
              </div>
            </div>
          </div>
        </div>

        {/* 心靈地圖預覽 - 最底部、淡化 */}
        <div className="w-full max-w-4xl animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-8">
            <div className="text-center mb-6">
              <p className="text-white/70 text-lg mb-2">
                💎 對話結束後，你會獲得專屬心靈地圖
              </p>
              <p className="text-white/50 text-sm">
                精美視覺化分析報告，看見你的內心宇宙
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-3xl mb-2">🎨</div>
                <p className="text-white/70 text-sm">情感軌跡</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-3xl mb-2">🛡️</div>
                <p className="text-white/70 text-sm">防衛機制</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-3xl mb-2">📚</div>
                <p className="text-white/70 text-sm">心理分析</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="text-3xl mb-2">📤</div>
                <p className="text-white/70 text-sm">可分享</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Footer />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}