'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams, useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/CosmicBackground';
import { EmotionIndicator } from '@/components/EmotionIndicator';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<unknown>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
        if ((recognitionRef as any).current) setTimeout(startRecognition, 50);
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
    <div className="min-h-screen bg-black relative">
      <CosmicBackground emotion={currentEmotion} />
      <EmotionIndicator emotion={currentEmotion} />

      {/* 頂部按鈕 - sticky */}
      <div className="sticky top-0 z-30 flex justify-between items-center px-2 py-2 backdrop-blur-md bg-black/40 border-b border-white/5">
        <button onClick={() => router.push('/')} className="bg-white/10 px-3 py-1 rounded-full border border-white/20 text-white/70 text-xs">
          ← 首頁
        </button>
        <span className="text-white/40 text-xs">{messageCount}/{MESSAGE_LIMIT} · {intentNames[intent] || intent}</span>
        <div className="flex gap-2">
          <button onClick={handleViewMindMap} disabled={messages.length === 0} className="bg-white/10 px-3 py-1 rounded-full border border-white/20 text-white/70 text-xs disabled:opacity-40">
            🗺️ 地圖
          </button>
          <button onClick={handleClearChat} disabled={messages.length === 0} className="bg-white/10 px-3 py-1 rounded-full border border-white/20 text-white/70 text-xs disabled:opacity-40">
            🔄
          </button>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {errorMessage && (
        <div className="sticky top-10 z-40 mx-2 mt-2">
          <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3">
            <button onClick={() => setErrorMessage(null)} className="float-right text-white/50 text-lg">×</button>
            <p className="text-white/90 text-sm font-medium">Aletheia 暫時需要休息 😴</p>
            <p className="text-white/70 text-xs mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 訊息區 - 正常文件流 */}
      <div className="relative z-10 max-w-3xl mx-auto px-2 py-4 space-y-3">
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

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                  <p className="text-xs text-white/80 mb-3 leading-relaxed">在這次深度對話中，我看見了你的勇氣與真誠。</p>
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

      {/* 輸入區 - 正常文件流最底部，鍵盤彈出時瀏覽器自動捲到這裡 */}
      <div className="relative z-20 border-t border-white/10 backdrop-blur-xl bg-black/80 px-2 pt-2 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex space-x-2 items-end">
            <button
              onClick={handleVoiceInput}
              disabled={isLoading || !sessionId || isLimitReached}
              className={`px-3 py-2 rounded-xl border transition-all flex-shrink-0 disabled:opacity-50 ${isListening ? 'bg-red-500/40 border-red-400/50 text-white animate-pulse' : 'bg-white/10 border-white/20 text-white/60'}`}
            >
              {isListening ? '🔴' : '🎙️'}
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => {
  const isMobile = window.innerWidth < 640;
  if (isMobile) {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 400);
  }
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
              className="px-3 py-2 sm:px-5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex-shrink-0"
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
    </div>
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