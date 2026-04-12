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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<unknown>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const finalTextRef = useRef<string>('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        .insert({ intent_type: intent, status: 'active' })
        .select()
        .single();
      if (data) {
        setSessionId(data.id);
      } else {
        console.error('會話建立失敗:', error);
        setSessionId(`temp-${Date.now()}`);
      }
    };
    initSession();
  }, [intent]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages]);

  const handleVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert('請使用 Chrome 瀏覽器開啟語音輸入');
      return;
    }
    if (isListening) {
      recognitionRef.current = null;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
      return;
    }
    finalTextRef.current = '';
    setIsListening(true);
    const startRecognition = () => {
      if (!(recognitionRef as any).current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = new SpeechRecognitionAPI() as any;
      r.lang = 'zh-TW';
      r.continuous = false;
      r.interimResults = false;
      r.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
          finalTextRef.current = finalTextRef.current
            ? finalTextRef.current + ' ' + transcript
            : transcript;
          setInput(finalTextRef.current);
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          (recognitionRef as any).current = null;
          setIsListening(false);
        }, 3000);
      };
      r.onend = () => {
        if ((recognitionRef as any).current) {
          setTimeout(startRecognition, 50);
        }
      };
      r.onerror = (e: any) => {
        if ((e.error === 'no-speech' || e.error === 'aborted') && (recognitionRef as any).current) {
          setTimeout(startRecognition, 50);
          return;
        }
        (recognitionRef as any).current = null;
        setIsListening(false);
      };
      (recognitionRef as any).current = r;
      try { r.start(); } catch {}
    };
    (recognitionRef as any).current = true;
    startRecognition();
  };

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
        body: JSON.stringify({ message: input, sessionId, intent }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (data.analysis) {
        setCurrentEmotion(data.analysis.emotion);
        setCurrentAnalysis(data.analysis);
      }
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      const updatedMessages = [...messages, userMessage, aiMessage];
      setMessages(prev => [...prev, aiMessage]);
      if (updatedMessages.length >= MESSAGE_LIMIT) {
        setTimeout(() => {
          fetch('/api/reflect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
            }),
          }).catch(console.error);
        }, 1000);
      }
    } catch (error) {
      console.error('發送失敗:', error);
      setErrorMessage('抱歉，Aletheia 暫時需要休息一下，請稍後再試。');
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
      alert('請先開始對話，才能查看心靈地圖');
    }
  };

  const handleClearChat = () => {
    if (confirm('確定要清除對話並開始新的會話嗎？')) {
      window.location.reload();
    }
  };

  return (
    <>
      {/* 全頁背景 */}
      <div className="fixed inset-0 bg-black z-0">
        <CosmicBackground emotion={currentEmotion} />
      </div>

      <EmotionIndicator emotion={currentEmotion} />

      {/* 頂部按鈕 */}
      <div className="fixed top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto z-30 flex justify-between sm:justify-start sm:space-x-3 gap-1">
        <button onClick={() => router.push('/')} className="backdrop-blur-md bg-white/10 px-2 py-1 sm:px-4 sm:py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all text-[10px] sm:text-sm">
          ← 首頁
        </button>
        <button onClick={handleViewMindMap} disabled={messages.length === 0} className={`backdrop-blur-md px-2 py-1 sm:px-4 sm:py-2 rounded-full border transition-all text-[10px] sm:text-sm ${messages.length >= 5 ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border-purple-400/50 text-white animate-pulse-subtle' : 'bg-white/10 border-white/20 text-white/70'} disabled:opacity-40`}>
          🗺️ 心靈地圖
        </button>
        <button onClick={handleClearChat} disabled={messages.length === 0} className="backdrop-blur-md bg-white/10 px-2 py-1 sm:px-4 sm:py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all text-[10px] sm:text-sm disabled:opacity-40">
          🔄 對話
        </button>
      </div>

      {/* 錯誤訊息 */}
      {errorMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
          <div className="backdrop-blur-md bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 shadow-2xl">
            <button onClick={() => setErrorMessage(null)} className="absolute top-2 right-3 text-white/50 hover:text-white text-lg">×</button>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">😴</div>
              <div>
                <p className="text-white/90 text-sm font-medium mb-1">Aletheia 暫時需要休息</p>
                <p className="text-white/70 text-xs leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 訊息捲動區 - 從頂部到輸入框上方 */}
      <div
        className="fixed left-0 right-0 z-10 overflow-y-auto"
        style={{ top: '44px', bottom: '130px' }}
      >
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pt-2 pb-4 space-y-3">
          {/* 標題 */}
          <div className="text-center py-2">
            <p className="text-[11px] text-white/40">{messageCount}/{MESSAGE_LIMIT} · {intentNames[intent] || intent}</p>
          </div>

          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[90%] bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white backdrop-blur-sm border border-white/10 px-4 py-4 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl mt-1">✨</div>
                  <div className="flex-1">
                    <p className="text-sm mb-2 leading-relaxed">你好，我是 Aletheia。</p>
                    <p className="text-base font-light mb-2 text-white">今天想要跟我談什麼呢？</p>
                    <p className="text-xs text-white/70 mb-3 leading-relaxed">你可以暢所欲言，這裡是安全的空間。無論是困擾、疑惑，還是單純想要被理解，我都在這裡陪伴你。</p>
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-[10px] text-white/50">💡 限時免費測試：每個對話最多 {MESSAGE_LIMIT} 則訊息</p>
                      <p className="text-[10px] text-white/40 mt-1">🎙️ 不想打字？點麥克風直接說話</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: `${index * 0.05}s` }}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${msg.role === 'user' ? 'bg-white/15 text-white' : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white backdrop-blur-sm border border-white/10'}`}>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                <span className="text-[10px] text-white/40 mt-1 block">{msg.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10 px-5 py-3 rounded-2xl">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          {isLimitReached && (
            <div className="flex justify-start">
              <div className="max-w-[90%] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-white backdrop-blur-sm border border-amber-400/30 px-4 py-4 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl mt-1">✨</div>
                  <div className="flex-1">
                    <p className="text-sm mb-2 leading-relaxed">我們的對話到這裡告一段落了。</p>
                    <p className="text-xs text-white/80 mb-3 leading-relaxed">在這次深度對話中，我看見了你的勇氣與真誠。每一個想法、每一份感受，都是你內心宇宙的一部分。</p>
                    <p className="text-sm font-light mb-3 text-white">💎 想看看我為你整理的心靈地圖嗎？</p>
                    <div className="flex flex-col space-y-2">
                      <button onClick={handleViewMindMap} className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white text-sm font-medium flex items-center justify-center space-x-2">
                        <span>🗺️</span><span>查看我的心靈地圖</span>
                      </button>
                      <button onClick={handleClearChat} className="w-full px-4 py-2.5 bg-white/10 rounded-xl text-white/80 text-xs">
                        🔄 開始新的對話
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 輸入區 - 永遠固定在底部 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 backdrop-blur-xl bg-black/70 px-2 sm:px-4 pt-2 pb-4"
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex space-x-2 items-end">
            <button
              onClick={handleVoiceInput}
              disabled={isLoading || !sessionId || isLimitReached}
              className={`px-3 py-2 rounded-xl border transition-all flex-shrink-0 disabled:opacity-50 ${isListening ? 'bg-red-500/40 border-red-400/50 text-white animate-pulse' : 'bg-white/10 border-white/20 text-white/60 hover:text-white'}`}
            >
              {isListening ? '🔴' : '🎙️'}
            </button>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 400);
              }}
              placeholder={isLimitReached ? '已達到訊息上限' : isListening ? '正在聆聽...' : '分享你的想法，或點🎙️說話'}
              className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none border border-white/20"
              rows={3}
              style={{ minHeight: '72px', maxHeight: '120px' }}
              disabled={isLoading || !sessionId || isLimitReached}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || !sessionId || isLimitReached}
              className="px-3 py-2 sm:px-5 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex-shrink-0"
            >
              {isLoading ? '...' : '發送'}
            </button>
          </div>
          {!isLimitReached && messageCount > 0 && (
            <div className="mt-1 text-[10px] text-white/40 text-center">
              還剩 {MESSAGE_LIMIT - messageCount} 則訊息
              {messageCount >= MESSAGE_LIMIT - 3 && <span className="text-yellow-400/60 ml-2">快到達上限了</span>}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
      `}</style>
    </>
  );
}

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