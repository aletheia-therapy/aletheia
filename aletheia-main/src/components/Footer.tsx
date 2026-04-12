'use client';

import { useState } from 'react';

export function Footer() {
  const fbUrl = "https://www.facebook.com/profile.php?id=61584252840273";
  const [showDonate, setShowDonate] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('06510502550');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* 贊助彈出視窗 */}
      {showDonate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowDonate(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md bg-gradient-to-br from-purple-900/90 to-black/90 border border-purple-500/30 rounded-3xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 關閉按鈕 */}
            <button
              onClick={() => setShowDonate(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-xl"
            >
              ×
            </button>

            {/* 內容 */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🌙</div>
              <h2 className="text-xl font-light text-white mb-4 leading-relaxed">
                謝謝你讓阿勒希雅繼續存在
              </h2>
              <div className="text-white/60 text-sm leading-relaxed space-y-3 text-left">
                <p>
                  我是阿勒希雅的研發者。我自己也是一位憂鬱症患者。
                </p>
                <p>
                  在最深的那些夜晚，我知道那種找不到人說話、不敢開口、或說了也怕被誤解的感受。所以我想做一個地方，讓每一個深夜裡孤獨的人，都有一個可以說話的地方。
                </p>
                <p>
                  阿勒希雅是我給這個世界的一份禮物。如果她曾經陪伴過你，或者你相信這樣的事情值得繼續存在——
                </p>
                <p className="text-purple-300">
                  歡迎留下一點溫度。讓這份愛循環下去，幫助更多需要她的人。💜
                </p>
              </div>
            </div>

            {/* 帳戶資訊 */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-4">
              <p className="text-white/40 text-xs text-center mb-4">銀行轉帳支持</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">銀行</span>
                  <span className="text-white/80 text-sm">兆豐銀行</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">戶名</span>
                  <span className="text-white/80 text-sm">吳聖儀</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">帳號</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg px-3 py-1.5 transition-all duration-200"
                  >
                    <span className="text-white/90 text-sm font-mono">06510502550</span>
                    <span className="text-purple-300 text-xs">
                      {copied ? '已複製 ✓' : '點擊複製'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-white/30 text-xs text-center">
              任何金額都是愛 · 完全自願 · 不留壓力 🌟
            </p>
          </div>
        </div>
      )}

      <footer className="relative z-10 py-2 px-3 sm:px-8 border-t border-white/10 backdrop-blur-md bg-white/5 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          {/* 手機版 */}
          <div className="sm:hidden flex items-center justify-between gap-2 text-[10px]">
            <p className="text-white/50 truncate">© 2026 心一線上</p>
            <div className="flex gap-3 text-white/40 flex-shrink-0 items-center">
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">FB</a>
              <a href="/about" className="hover:text-white/60 transition-colors">關於</a>
              <button
                onClick={() => setShowDonate(true)}
                className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full text-[10px] hover:from-purple-500/40 hover:to-pink-500/40 transition-all"
              >
                💜 支持
              </button>
            </div>
          </div>

          {/* 桌面版 */}
          <div className="hidden sm:flex items-center justify-between gap-4 text-xs">
            <p className="text-white/50">
              Aletheia 阿勒希雅 · 首席AI心理師 · © 2026 <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">心一線上心理諮詢室</a> 版權所有
            </p>
            <div className="flex gap-4 text-white/40 flex-shrink-0 items-center">
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Facebook</a>
              <a href="/about" className="hover:text-white/60 transition-colors">關於我們</a>
              <button
                onClick={() => setShowDonate(true)}
                className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/40 text-purple-300 px-4 py-1.5 rounded-full hover:from-purple-500/40 hover:to-pink-500/40 transition-all text-xs"
              >
                💜 支持阿勒希雅
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}