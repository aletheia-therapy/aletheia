'use client';

export function Footer() {
  return (
    <footer className="relative z-10 py-6 px-8 border-t border-white/10 backdrop-blur-md bg-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-white/60 text-sm">
              Aletheia 阿勒希雅 · 首席AI心理師
            </p>
            <p className="text-white/40 text-xs mt-1">
              © 2026 <a href="https://www.facebook.com/profile.php?id=61584252840273" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">心一線上心理諮詢室</a> 版權所有
            </p>
          </div>
          <div className="flex gap-6 text-xs text-white/40">
            <a href="https://www.facebook.com/profile.php?id=61584252840273" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Facebook</a>
            <a href="/about" className="hover:text-white/60 transition-colors">關於我們</a>
          </div>
        </div>
      </div>
    </footer>
  );
}