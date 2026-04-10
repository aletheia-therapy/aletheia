'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CosmicBackground } from '@/components/CosmicBackground';
import Link from 'next/link';
import { Footer } from '@/components/Footer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MessageData {
  id: string;
  content: string;
  role: string;
  created_at: string;
  metadata: any;
}

// 內部 Component 使用 useSearchParams
function MindMapContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // 載入會話資料
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const loadMessages = async () => {
      const { data: allData, error: allError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (allError) {
        console.error('❌ 查詢錯誤:', allError);
        setIsLoading(false);
        return;
      }

      if (!allData || allData.length === 0) {
        setIsLoading(false);
        return;
      }

      const messagesWithMetadata = allData.filter(msg => 
        msg.metadata && Object.keys(msg.metadata).length > 0
      );

      setMessages(messagesWithMetadata);
      setIsLoading(false);
    };

    loadMessages();
  }, [sessionId]);

  // 取得情感顏色
  const getEmotionColor = (emotion: string = '未知'): string => {
    const colorMap: Record<string, string> = {
      '焦慮': '#FF8C42',
      '深層焦慮': '#FF8C42',
      '悲傷': '#6B7280',
      '深層悲傷': '#6B7280',
      '自我貶抑': '#6B7280',
      '憤怒': '#EF4444',
      '恐懼': '#8B5CF6',
      '喜悅': '#FBBF24',
      '平靜': '#60A5FA',
      '希望': '#34D399',
      '困惑': '#A78BFA',
      '未知': '#9CA3AF',
    };

    if (colorMap[emotion]) return colorMap[emotion];
    if (emotion.includes('焦慮')) return colorMap['焦慮'];
    if (emotion.includes('悲傷')) return colorMap['悲傷'];
    if (emotion.includes('憤怒')) return colorMap['憤怒'];
    if (emotion.includes('恐懼')) return colorMap['恐懼'];
    
    return colorMap['未知'];
  };

  // 計算統計數據
  const getStatistics = () => {
    if (messages.length === 0) return null;

    const emotions = messages.map(m => m.metadata?.emotion || '未知');
    const emotionCounts: Record<string, number> = {};
    emotions.forEach(e => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });

    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
    const avgIntensity = messages.reduce((sum, m) => sum + (m.metadata?.emotion_intensity || 5), 0) / messages.length;

    const allDefenses = messages.flatMap(m => m.metadata?.defense_mechanisms || []);
    const uniqueDefenses = [...new Set(allDefenses)];

    const allTheories = messages.flatMap(m => m.metadata?.active_theories || []);
    const uniqueTheories = [...new Set(allTheories)];

    return {
      dominantEmotion: dominantEmotion[0],
      dominantEmotionCount: dominantEmotion[1],
      avgIntensity: avgIntensity.toFixed(1),
      totalMessages: messages.length,
      uniqueDefenses,
      uniqueTheories,
      emotionCounts,
    };
  };

  const stats = getStatistics();

  // 分享功能
  const handleShare = (platform: string) => {
    const shareText = `我剛在 Aletheia 完成了一次深度心靈對話！AI 心理師分析出我的主要情感是「${stats?.dominantEmotion}」，真的好準 🌟`;
    const shareUrl = window.location.href;

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      instagram: '', // IG 需要特殊處理
      threads: `https://threads.net/intent/post?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    };

    if (platform === 'instagram') {
      alert('Instagram 不支援直接分享連結，但你可以截圖這個頁面分享到限時動態！📸');
      return;
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('連結已複製！可以貼到任何地方分享 ✨');
  };

  if (!sessionId) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
        <CosmicBackground emotion="平靜" />
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center text-white/60">
            <p className="text-xl mb-4">❌ 缺少會話 ID</p>
            <Link href="/" className="text-purple-400 hover:text-purple-300">
              返回首頁
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <CosmicBackground emotion={stats?.dominantEmotion || '平靜'} />

      {/* 頂部導航 */}
      <div className="relative z-10 px-8 py-6 flex items-center justify-between">
        <Link 
          href={`/therapy?intent=explore`}
          className="text-white/60 hover:text-white transition-colors text-base"
        >
          ← 返回對話
        </Link>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full text-white font-medium transition-all flex items-center space-x-2 text-base"
          >
            <span>📤</span>
            <span>分享我的心靈地圖</span>
          </button>
        </div>
      </div>

      {/* 分享選單 */}
      {showShareMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowShareMenu(false)}>
          <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md rounded-3xl p-8 max-w-md w-full mx-4 border border-white/20" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-light text-white mb-6 text-center">分享到社群</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleShare('facebook')}
                className="p-4 bg-[#1877F2] hover:bg-[#0d65d9] rounded-2xl text-white transition-all flex flex-col items-center space-y-2"
              >
                <span className="text-3xl">📘</span>
                <span className="text-base font-medium">Facebook</span>
              </button>
              <button
                onClick={() => handleShare('instagram')}
                className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl text-white transition-all flex flex-col items-center space-y-2"
              >
                <span className="text-3xl">📷</span>
                <span className="text-base font-medium">Instagram</span>
              </button>
              <button
                onClick={() => handleShare('threads')}
                className="p-4 bg-black hover:bg-gray-900 rounded-2xl text-white transition-all flex flex-col items-center space-y-2"
              >
                <span className="text-3xl">🧵</span>
                <span className="text-base font-medium">Threads</span>
              </button>
              <button
                onClick={() => handleShare('line')}
                className="p-4 bg-[#00B900] hover:bg-[#009900] rounded-2xl text-white transition-all flex flex-col items-center space-y-2"
              >
                <span className="text-3xl">💬</span>
                <span className="text-base font-medium">LINE</span>
              </button>
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all text-base font-medium"
            >
              🔗 複製連結
            </button>
          </div>
        </div>
      )}

      {/* 主要內容 */}
      <div className="relative z-10 px-4 md:px-8 py-8 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="text-center text-white/40 mt-20">
            <p className="text-2xl">✨ 正在生成你的心靈地圖...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-white/40 mt-20">
            <p className="text-2xl mb-4">✨ 尚無分析資料</p>
            <p className="text-lg">開始對話後，這裡會顯示你的心靈軌跡</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 標題卡片 */}
            <div className="backdrop-blur-md bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl border border-white/20 p-10 text-center">
              <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
                🌌 你的心靈宇宙
              </h1>
              <p className="text-xl text-white/80 mb-2">
                {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-lg text-white/60">
                深度對話 {stats?.totalMessages} 則訊息 · 由 Aletheia 分析
              </p>
            </div>

            {/* 核心洞察卡片 */}
            <div className="backdrop-blur-md bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl border border-amber-400/30 p-10">
              <h2 className="text-3xl font-light text-white mb-8 text-center">💎 核心洞察</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 主要情感 */}
                <div className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <div 
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
                    style={{
                      backgroundColor: getEmotionColor(stats?.dominantEmotion || ''),
                      boxShadow: `0 0 30px ${getEmotionColor(stats?.dominantEmotion || '')}`,
                    }}
                  >
                    {stats?.dominantEmotion === '焦慮' && '😰'}
                    {stats?.dominantEmotion === '悲傷' && '😢'}
                    {stats?.dominantEmotion === '喜悅' && '😊'}
                    {stats?.dominantEmotion === '平靜' && '😌'}
                    {stats?.dominantEmotion === '希望' && '🌟'}
                    {!['焦慮', '悲傷', '喜悅', '平靜', '希望'].includes(stats?.dominantEmotion || '') && '💭'}
                  </div>
                  <p className="text-white/60 text-base mb-2">主要情感</p>
                  <p className="text-white text-2xl font-medium mb-1">{stats?.dominantEmotion}</p>
                  <p className="text-white/50 text-sm">出現 {stats?.dominantEmotionCount} 次</p>
                </div>

                {/* 情感強度 */}
                <div className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl">
                    ⚡
                  </div>
                  <p className="text-white/60 text-base mb-2">平均情感強度</p>
                  <p className="text-white text-2xl font-medium mb-1">{stats?.avgIntensity} / 10</p>
                  <p className="text-white/50 text-sm">
                    {parseFloat(stats?.avgIntensity || '5') >= 7 ? '情緒波動較大' : parseFloat(stats?.avgIntensity || '5') >= 5 ? '情緒適中' : '情緒較為平穩'}
                  </p>
                </div>

                {/* 對話深度 */}
                <div className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-4xl">
                    🧠
                  </div>
                  <p className="text-white/60 text-base mb-2">對話深度</p>
                  <p className="text-white text-2xl font-medium mb-1">{stats?.totalMessages} 則</p>
                  <p className="text-white/50 text-sm">約 {Math.round((stats?.totalMessages || 0) * 3)} 分鐘深度對話</p>
                </div>
              </div>
            </div>

            {/* 情感軌跡 */}
            <div className="backdrop-blur-md bg-white/5 rounded-3xl border border-white/10 p-10">
              <h2 className="text-3xl font-light text-white mb-8">🎭 情感軌跡</h2>
              
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const emotion = msg.metadata?.emotion || '未知';
                  const intensity = msg.metadata?.emotion_intensity || 5;
                  const color = getEmotionColor(emotion);
                  
                  return (
                    <div
                      key={msg.id}
                      className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: color,
                              boxShadow: `0 0 15px ${color}`,
                            }}
                          />
                          <div>
                            <p className="text-white text-xl font-medium">{emotion}</p>
                            <p className="text-white/50 text-sm">強度 {intensity}/10</p>
                          </div>
                        </div>
                        <div className="text-white/40 text-base">第 {index + 1} 則</div>
                      </div>

                      {/* 情感強度條 */}
                      <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{
                            width: `${intensity * 10}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`,
                          }}
                        />
                      </div>

                      {/* 防衛機制標籤 */}
                      {msg.metadata?.defense_mechanisms && msg.metadata.defense_mechanisms.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {msg.metadata.defense_mechanisms.map((dm: string, i: number) => (
                            <span
                              key={i}
                              className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 text-base border border-purple-500/30"
                            >
                              🛡️ {dm}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 心理防衛機制 */}
            {stats && stats.uniqueDefenses.length > 0 && (
              <div className="backdrop-blur-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl border border-purple-400/30 p-10">
                <h2 className="text-3xl font-light text-white mb-8">🛡️ 你的心理防衛機制</h2>
                <p className="text-white/70 text-lg mb-6 leading-relaxed">
                  在這次對話中，我觀察到你使用了以下防衛機制。這些都是正常的心理保護方式，幫助你應對壓力和不適。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.uniqueDefenses.map((defense, i) => (
                    <div key={i} className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
                      <p className="text-white text-xl font-medium">🛡️ {defense}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 應用心理學理論 */}
            {stats && stats.uniqueTheories.length > 0 && (
              <div className="backdrop-blur-md bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl border border-blue-400/30 p-10">
                <h2 className="text-3xl font-light text-white mb-8">📚 應用心理學理論</h2>
                <p className="text-white/70 text-lg mb-6 leading-relaxed">
                  Aletheia 在分析你的對話時，運用了以下心理學流派的理論，為你提供多元視角的洞察。
                </p>
                <div className="flex flex-wrap gap-3">
                  {stats.uniqueTheories.map((theory, i) => (
                    <span
                      key={i}
                      className="px-6 py-3 rounded-xl bg-blue-500/20 text-blue-300 text-lg border border-blue-500/30"
                    >
                      {theory}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 付費版預覽 */}
            <div className="backdrop-blur-md bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-3xl border-2 border-yellow-400/50 p-10 text-center">
              <div className="text-6xl mb-6">🔒</div>
              <h2 className="text-3xl font-light text-white mb-4">解鎖完整心靈報告</h2>
              <p className="text-white/80 text-lg mb-6 leading-relaxed max-w-2xl mx-auto">
                這只是免費版的心靈地圖。完整版包含：
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto">
                <div className="p-5 bg-white/10 rounded-2xl text-left">
                  <p className="text-white text-lg">📊 詳細情緒變化曲線圖</p>
                </div>
                <div className="p-5 bg-white/10 rounded-2xl text-left">
                  <p className="text-white text-lg">🎯 個人化行動建議</p>
                </div>
                <div className="p-5 bg-white/10 rounded-2xl text-left">
                  <p className="text-white text-lg">💬 金句摘錄與反思</p>
                </div>
                <div className="p-5 bg-white/10 rounded-2xl text-left">
                  <p className="text-white text-lg">📄 精美 PDF 下載</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-white/60 text-xl line-through mb-2">原價 NT$ 499</p>
                <p className="text-white text-4xl font-bold mb-2">限時優惠 NT$ 299</p>
                <p className="text-white/70 text-base">比一杯咖啡還便宜的心靈投資</p>
              </div>
              <button className="px-12 py-5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 rounded-full text-black text-xl font-bold transition-all shadow-2xl">
                🎁 立即解鎖完整報告
              </button>
              <p className="text-white/50 text-sm mt-6">💡 測試期間暫不開放購買，敬請期待</p>
            </div>

            {/* Aletheia 簽名 */}
            <div className="text-center py-8">
              <p className="text-white/40 text-lg mb-2">── 由 Aletheia 阿勒希雅 · 首席AI心理師 分析 ──</p>
              <p className="text-white/30 text-base">真理之境 · 心靈的宇宙</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// 主 Component 包裝 Suspense
export default function MindMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">✨ 載入中...</div>
      </div>
    }>
      <MindMapContent />
    </Suspense>
  );
}