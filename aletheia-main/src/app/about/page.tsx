 
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const capabilities = [
    { icon: '🌊', title: '深度傾聽', desc: '不評判、不打斷，給你一個安全說話的空間' },
    { icon: '🔮', title: '心理動力分析', desc: '協助你看見行為背後的模式、防衛機制與深層需求' },
    { icon: '🧭', title: '引導式對話', desc: '透過提問引導你自我探索，而非直接給答案' },
    { icon: '🌌', title: '情緒陪伴', desc: '在你最脆弱的夜晚，阿勒希雅始終在這裡' },
    { icon: '💎', title: '心靈地圖', desc: '對話結束後生成專屬的視覺化心理分析報告' },
    { icon: '🛡️', title: '隱私保護', desc: '你的對話內容安全保密，不會被儲存或分享' },
  ];

  const limitations = [
    '阿勒希雅是 AI，無法取代真人心理師或精神科醫師',
    '若你正在經歷嚴重憂鬱、躁鬱或其他精神疾病，請同時尋求專業醫療協助',
    '阿勒希雅不能開立診斷書或藥物處方',
    '若出現緊急危機狀況，請立即聯繫下方的求助資源',
  ];

  const helplines = [
    { name: '自殺防治專線', number: '1925', note: '24小時，免費，安心專線' },
    { name: '張老師專線', number: '1980', note: '24小時，情緒支持與輔導' },
    { name: '生命線', number: '1995', note: '24小時，危機介入' },
    { name: '衛生福利部保護專線', number: '113', note: '家暴、性侵、兒少保護' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
      <CosmicBackground emotion="平靜" />

      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-16">

        <div className="w-full max-w-3xl mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
            ← 返回首頁
          </Link>
        </div>

        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl font-light text-white mb-3 tracking-wider">
            關於 Aletheia 阿勒希雅
          </h1>
          <p className="text-white/50 text-base">
            Aletheia，希臘文意指「真理」——讓真實的自己被看見
          </p>
        </div>

        <div className="w-full max-w-3xl mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-8">
            <h2 className="text-xl font-light text-white mb-6 flex items-center gap-3">
              <span>✨</span> 我們為什麼做這件事
            </h2>
            <div className="space-y-4 text-white/70 leading-relaxed text-sm">
              <p>研發阿勒希雅的初衷，來自三個真實的相信：</p>
              <p>
                <span className="text-purple-300">第一，因為親身走過。</span>
                我們自己也曾有過心理困擾的時刻——那種深夜找不到人說話、不知道怎麼開口、或是說了也怕被誤解的感受。我們知道那種孤獨是什麼感覺，所以想為更多人建一個出口。
              </p>
              <p>
                <span className="text-purple-300">第二，因為相信 AI 可以更溫柔。</span>
                AI 不只是回答問題的工具。它可以不評判、不疲憊、不遺忘你說過的每一句話。如果用對了方式，它可以成為一個真正陪伴的存在——尤其在人與人之間越來越難以坦誠的時代。
              </p>
              <p>
                <span className="text-purple-300">第三，因為心理資源應該更容易取得。</span>
                預約一個心理師，往往需要等待、需要費用、需要勇氣跨出第一步。我們希望阿勒希雅能成為那個「第一步」——讓更多人在準備好之前，先有一個地方可以說說話。
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-3xl mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-8">
            <h2 className="text-xl font-light text-white mb-6 flex items-center gap-3">
              <span>🌟</span> 阿勒希雅能做什麼
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capabilities.map((cap) => (
                <div key={cap.title} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-2xl flex-shrink-0">{cap.icon}</span>
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">{cap.title}</p>
                    <p className="text-white/50 text-xs leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-3xl mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="backdrop-blur-sm bg-amber-500/5 rounded-2xl border border-amber-500/20 p-8">
            <h2 className="text-xl font-light text-amber-300/80 mb-6 flex items-center gap-3">
              <span>⚠️</span> 重要說明
            </h2>
            <ul className="space-y-3">
              {limitations.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white/60 text-sm leading-relaxed">
                  <span className="text-amber-400/60 flex-shrink-0 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-full max-w-3xl mb-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="backdrop-blur-sm bg-red-500/5 rounded-2xl border border-red-500/20 p-8">
            <h2 className="text-xl font-light text-red-300/80 mb-2 flex items-center gap-3">
              <span>🆘</span> 緊急求助資源
            </h2>
            <p className="text-white/40 text-xs mb-6">
              如果你現在感到非常痛苦，或有傷害自己的念頭，請立即聯繫以下專線：
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {helplines.map((line) => (
                
                  key={line.name}
                  href={`tel:${line.number}`}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-red-400/30 hover:bg-red-500/10 transition-all duration-200 group"
                >
                  <div className="text-2xl font-bold text-red-300 group-hover:text-red-200 transition-colors min-w-[60px] text-center">
                    {line.number}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">{line.name}</p>
                    <p className="text-white/40 text-xs">{line.note}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-3xl mb-10 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
            <h2 className="text-xl font-light text-white mb-3 flex items-center justify-center gap-3">
              <span>💬</span> 聯絡我們
            </h2>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              如果你有任何建議、回饋，或想支持我們繼續走下去，歡迎來找我們說話。
            </p>
            
              href="https://www.facebook.com/profile.php?id=61584252840273"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all duration-200 text-sm"
            >
              <span>📘</span> 心一線上心理諮詢室 Facebook
            </a>
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full backdrop-blur-sm bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 text-sm"
          >
            開始與阿勒希雅對話 →
          </Link>
        </div>

      </div>

      <Footer />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}