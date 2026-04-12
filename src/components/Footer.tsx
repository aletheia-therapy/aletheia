'use client';

export function Footer() {
  const fbUrl = "https://www.facebook.com/profile.php?id=61584252840273";

  return (
    <footer className="relative z-10 py-2 px-3 sm:px-8 border-t border-white/10 backdrop-blur-md bg-white/5 flex-shrink-0">
      <div className="max-w-6xl mx-auto">
        {/* 手機版：極簡單行 */}
        <div className="sm:hidden flex items-center justify-between gap-2 text-[10px]">
          <p className="text-white/50 truncate">© 2026 心一線上</p>
          <div className="flex gap-3 text-white/40 flex-shrink-0">
            <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">FB</a>
            <a href="/about" className="hover:text-white/60 transition-colors">關於</a>
          </div>
        </div>

        {/* 桌面版：縮小單行 */}
        <div className="hidden sm:flex items-center justify-between gap-4 text-xs">
          <p className="text-white/50">
            Aletheia 阿勒希雅 · 首席AI心理師 · © 2026 <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">心一線上心理諮詢室</a> 版權所有
          </p>
          <div className="flex gap-4 text-white/40 flex-shrink-0">
            <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Facebook</a>
            <a href="/about" className="hover:text-white/60 transition-colors">關於我們</a>
          </div>
        </div>
      </div>
    </footer>
  );
}