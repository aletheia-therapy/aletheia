'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams, useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/CosmicBackground';
import { EmotionIndicator } from '@/components/EmotionIndicator';
import { Footer } from '@/components/Footer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Analysis {
  emotion: string;
  emotionIntensity: number;
  defenseMechanisms: string[];
  adlerianPurpose: string;
  activeTheories: string[];
  energyLevel: string;
}

const MESSAGE_LIMIT = 15;

// 內部 Component 使用 useSearchParams
function TherapyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent') || 'explore';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentEmotion, setCurrentEmotion] = useState('平靜');
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [showMindMapHint, setShowMindMapHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const intentNames: Record<string, string> = {
    explore: '探索',
    solve: '解決',
    understand: '理解',
  };

  const messageCount = messages.length;
  const isLimitReached = messageCount >= MESSAGE_LIMIT;

  useEffect(() => {
    if (messageCount >= 8 && messageCount <= 10 && !showMindMapHint) {
      setTimeout(() => setShowMindMapHint(true), 1000);
    }
  }, [messageCount, showMindMapHint]);

  useEffect(() => {
    const initSession = async () => {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .insert({
          intent_type: intent,
          status: 'active',
        })
        .select()
        .single();

      if (data) {
        setSessionId(data.id);
        console.log('✅ 會話已建立:', data.id, '意圖:', intent);
      } else {
        console.error('❌ 會話建立失敗:', JSON.stringify(error, null, 2));
        const tempId = `temp-${Date.now()}`;
        setSessionId(tempId);
        console.warn('⚠️ 使用臨時會話 ID:', tempId);
      }
    };

    initSession();
  }, [intent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isLimitReached) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId,
          intent,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.analysis) {
        setCurrentEmotion(data.analysis.emotion);
        setCurrentAnalysis(data.analysis);
        console.log('🎨 情感分析:', data.analysis);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('❌ 發送訊息失敗:', error);
      
      setErrorMessage('抱歉,Aletheia 暫時需要休息一下 😴 請稍後再試,或重新整理頁面。');
      
      setMessages(prev => prev.slice(0, -1));
      setInput(userMessage.content);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleViewMindMap = () => {
    if (sessionId && !sessionId.startsWith('temp-')) {
      router.push(`/mind-map?session=${sessionId}`);
    } else {
      alert('請先開始對話,才能查看心靈地圖');
    }
  };

  const handleClearChat = () => {
    if (confirm('確定要清除對話並開始新的會話嗎?')) {
      window.location.reload();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
      <CosmicBackground emotion={currentEmotion} />
      <EmotionIndicator emotion={currentEmotion} />

      <div className="absolute top-6 left-6 z-20 flex space-x-4">
        <button
          onClick={() => router.push('/')}
          className="backdrop-blur-md bg-white/5 px-4 py-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
        >
          ← 返回首頁
        </button>
        <button
          onClick={handleViewMindMap}
          disabled={messages.length === 0}
          className={`
            backdrop-blur-md px-4 py-2 rounded-full border transition-all text-sm
            ${messages.length >= 5 
              ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border-purple-400/50 text-white hover:from-purple-500/40 hover:to-blue-500/40 animate-pulse-subtle' 
              : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          🗺️ 查看心靈地圖
        </button>
        <button
          onClick={handleClearChat}
          disabled={messages.length === 0}
          className="backdrop-blur-md bg-white/5 px-4 py-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 清除對話
        </button>
      </div>

      {showMindMapHint && !isLimitReached && (
        <div className="fixed bottom-24 right-6 z-30 animate-slide-up">
          <div className="backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-2xl px-5 py-4 shadow-2xl max-w-sm">
            <button
              onClick={() => setShowMindMapHint(false)}
              className="absolute top-2 right-2 text-white/40 hover:text-white/80 transition-colors"
            >
              ×
            </button>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💡</div>
              <div>
                <p className="text-sm text-white/90 mb-2 leading-relaxed">
                  <strong>提示:</strong>對話進行到一半了!
                </p>
                <p className="text-xs text-white/70 leading-relaxed">
                  對話結束後,你可以查看我為你整理的<strong>心靈地圖</strong>,看見這次對話的情感軌跡和心理洞察。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 animate-slide-down">
          <div className="backdrop-blur-md bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-2xl px-6 py-4 shadow-2xl max-w-md">
            <button
              onClick={() => setErrorMessage(null)}
              className="absolute top-2 right-2 text-white/40 hover:text-white/80 transition-colors text-lg"
            >
              ×
            </button>
            <div className="flex items-start space-x-3">
              <div className="text-3xl">😴</div>
              <div>
                <p className="text-white/90 text-base font-medium mb-2">
                  Aletheia 暫時需要休息
                </p>
                <p className="text-white/70 text-sm leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-light text-white mb-1">Aletheia 阿勒希雅</h1>
          <h2 className="text-base font-light text-white/70 mb-2">首席AI心理師</h2>
          <p className="text-sm text-white/60">宇宙中的心靈對話</p>
          <p className="text-xs text-white/40 mt-2">
            當前意圖:{intentNames[intent] || intent}
          </p>
          <p className="text-xs text-white/40 mt-1">
            訊息數量:{messageCount}/{MESSAGE_LIMIT}
          </p>
        </div>

        <div className="w-full max-w-3xl h-[600px] flex flex-col backdrop-blur-md bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[85%] bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white backdrop-blur-sm border border-white/10 px-6 py-5 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl mt-1">✨</div>
                    <div className="flex-1">
                      <p className="text-base mb-3 leading-relaxed">
                        你好,我是 Aletheia。
                      </p>
                      <p className="text-lg font-light mb-3 text-white">
                        今天想要跟我談什麼呢?
                      </p>
                      <p className="text-sm text-white/70 mb-4 leading-relaxed">
                        你可以暢所欲言,這裡是安全的空間。無論是困擾、疑惑,還是單純想要被理解,我都在這裡陪伴你。
                      </p>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-white/50">
                          💡 限時免費測試:每個對話最多 {MESSAGE_LIMIT} 則訊息(約 30-45 分鐘深度對話)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`max-w-[80%] px-5 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-white/10 text-white backdrop-blur-sm'
                      : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white backdrop-blur-sm border border-white/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <span className="text-xs text-white/40 mt-2 block">
                    {msg.timestamp.toLocaleTimeString('zh-TW', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white backdrop-blur-sm border border-white/10 px-5 py-3 rounded-2xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {isLimitReached && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[85%] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-white backdrop-blur-sm border border-amber-400/30 px-6 py-6 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl mt-1">✨</div>
                    <div className="flex-1">
                      <p className="text-base mb-3 leading-relaxed">
                        我們的對話到這裡告一段落了。
                      </p>
                      <p className="text-sm text-white/80 mb-4 leading-relaxed">
                        在這次深度對話中,我看見了你的勇氣與真誠。每一個想法、每一份感受,都是你內心宇宙的一部分。
                      </p>
                      <p className="text-base font-light mb-4 text-white">
                        💎 想看看我為你整理的心靈地圖嗎?
                      </p>
                      <p className="text-xs text-white/60 mb-5 leading-relaxed">
                        我已經把這次對話的情感軌跡、核心議題、心理洞察整理成視覺化的心靈地圖,幫助你更清晰地看見自己。
                      </p>
                      
                      <div className="flex flex-col space-y-3">
                        <button
                          onClick={handleViewMindMap}
                          className="w-full px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-medium transition-all flex items-center justify-center space-x-2"
                        >
                          <span>🗺️</span>
                          <span>查看我的心靈地圖</span>
                        </button>
                        
                        <button
                          onClick={handleClearChat}
                          className="w-full px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 text-sm transition-all"
                        >
                          🔄 或者,開始新的對話
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-white/40 text-center">
                          💡 測試期間完全免費 · 你的隱私完全受保護
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/10 backdrop-blur-sm bg-white/5">
            <div className="flex space-x-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isLimitReached 
                    ? '已達到訊息上限,請查看心靈地圖或開始新對話...' 
                    : '在這裡分享你的想法...'
                }
                className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none backdrop-blur-sm border border-white/10"
                rows={2}
                disabled={isLoading || !sessionId || isLimitReached}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !sessionId || isLimitReached}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? '...' : '發送'}
              </button>
            </div>

            {messageCount >= 2 && !isLimitReached && (
              <div className="mt-3 px-4 py-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🗺️</span>
                    <div>
                      <p className="text-white/90 text-sm font-medium">隨時可查看你的心靈地圖</p>
                      <p className="text-white/60 text-xs">點選上方按鈕,查看目前對話的完整分析</p>
                    </div>
                  </div>
                  <button
                    onClick={handleViewMindMap}
                    className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/40 border border-purple-400/30 rounded-lg text-white text-xs font-medium transition-all whitespace-nowrap"
                  >
                    立即查看
                  </button>
                </div>
              </div>
            )}

            {!isLimitReached && messageCount > 0 && (
              <div className="mt-3 text-xs text-white/40 text-center">
                還剩 {MESSAGE_LIMIT - messageCount} 則訊息
                {messageCount >= MESSAGE_LIMIT - 3 && (
                  <span className="text-yellow-400/60 ml-2">⚠️ 快到達上限了</span>
                )}
              </div>
            )}

            {currentAnalysis && (
              <div className="mt-3 text-xs text-white/30 space-y-1">
                <p>💭 情感: {currentAnalysis.emotion} ({currentAnalysis.emotionIntensity}/10)</p>
                {currentAnalysis.defenseMechanisms.length > 0 && (
                  <p>🛡️ 防衛: {currentAnalysis.defenseMechanisms.join(', ')}</p>
                )}
                <p>⚡ 能量: {currentAnalysis.energyLevel}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.6s ease-out forwards;
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// 主 Component 包裝 Suspense
export default function TherapyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">✨ 載入中...</div>
      </div>
    }>
      <TherapyContent />
    </Suspense>
  );
}