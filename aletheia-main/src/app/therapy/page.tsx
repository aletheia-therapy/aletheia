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
  const [currentEmotion, setCurrentEmotion] = useState('撟喲?');
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [showMindMapHint, setShowMindMapHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const intentNames: Record<string, string> = {
    explore: '?Ｙ揣',
    solve: '閫?捱',
    understand: '?圾',
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
        console.log('???店撌脣遣蝡?', data.id, '??:', intent);
      } else {
        console.error('???店撱箇?憭望?:', JSON.stringify(error, null, 2));
        const tempId = `temp-${Date.now()}`;
        setSessionId(tempId);
        console.warn('?? 雿輻?冽??店 ID:', tempId);
      }
    };

    initSession();
  }, [intent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('雿??汗?其??舀隤頛詨嚗遣霅唬蝙??Chrome ?汗??);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition: typeof SpeechRecognition }).SpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'zh-TW';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
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
        console.log('? ????:', data.analysis);
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
        console.log('?? 撠店?銝?嚗孛?潸??航????..');
        setTimeout(() => {
          fetch('/api/reflect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              messages: updatedMessages.map(m => ({
                role: m.role,
                content: m.content,
              })),
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                console.log(
                  `??????| ?釭:${data.reflection.quality}/10 | ` +
                  `?啣??芾釭??:${data.reflection.goodResponsesCount} 蝑?| ` +
                  `?芰璁艙:${data.reflection.unknownConceptsCount} ??| ` +
                  `?:NT$${(data.cost * 1).toFixed(4)}`
                );
              } else {
                console.error('?仃??', data.error);
              }
            })
            .catch((err) => {
              console.error('??API ?澆憭望?:', err);
            });
        }, 1000);
      }

    } catch (error) {
      console.error('???潮??臬仃??', error);
      setErrorMessage('?望?,Aletheia ?急??閬??臭?銝?? 隢?敺?閰????唳???Ｕ?);
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
      alert('隢???撠店,??亦?敹??啣?');
    }
  };

  const handleClearChat = () => {
    if (confirm('蝣箏?閬??文?閰曹蒂???啁??店??')) {
      window.location.reload();
    }
  };

  return (
    <div className="relative min-h-screen h-screen overflow-hidden bg-black flex flex-col">
      <CosmicBackground emotion={currentEmotion} />
      <EmotionIndicator emotion={currentEmotion} />

      {/* ?????*/}
      <div className="absolute top-2 left-2 right-2 sm:top-6 sm:left-6 sm:right-auto z-20 flex justify-between sm:justify-start sm:space-x-4 gap-1">
        <button
          onClick={() => router.push('/')}
          className="backdrop-blur-md bg-white/5 px-2 py-1 sm:px-4 sm:py-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] sm:text-sm"
        >
          ??<span className="hidden sm:inline">餈?</span>擐?
        </button>
        <button
          onClick={handleViewMindMap}
          disabled={messages.length === 0}
          className={`backdrop-blur-md px-2 py-1 sm:px-4 sm:py-2 rounded-full border transition-all text-[10px] sm:text-sm ${messages.length >= 5 ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border-purple-400/50 text-white hover:from-purple-500/40 hover:to-blue-500/40 animate-pulse-subtle' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          ?儭?<span className="hidden sm:inline">?亦?</span>敹??啣?
        </button>
        <button
          onClick={handleClearChat}
          disabled={messages.length === 0}
          className="backdrop-blur-md bg-white/5 px-2 py-1 sm:px-4 sm:py-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ?? <span className="hidden sm:inline">皜</span>撠店
        </button>
      </div>

      {/* ?航炊閮 */}
      {errorMessage && (
        <div className="fixed top-14 sm:top-24 left-1/2 transform -translate-x-1/2 z-40 animate-slide-down w-[92%] sm:w-auto">
          <div className="backdrop-blur-md bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 shadow-2xl max-w-md">
            <button
              onClick={() => setErrorMessage(null)}
              className="absolute top-2 right-2 text-white/40 hover:text-white/80 transition-colors text-lg"
            >
              ?
            </button>
            <div className="flex items-start space-x-3">
              <div className="text-2xl sm:text-3xl">?</div>
              <div>
                <p className="text-white/90 text-sm sm:text-base font-medium mb-1 sm:mb-2">
                  Aletheia ?急??閬???                </p>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 撌虫?閫????筑???*/}
      {currentAnalysis && (
        <div className="hidden sm:block fixed bottom-14 left-4 z-20 animate-fade-in">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl max-w-xs">
            <p className="text-xs text-white/40 mb-2 font-medium">?單?敹???</p>
            <div className="space-y-1.5 text-sm text-white/70">
              <p>? <span className="text-white/50">??:</span> {currentAnalysis.emotion} <span className="text-white/40">({currentAnalysis.emotionIntensity}/10)</span></p>
              {currentAnalysis.defenseMechanisms.length > 0 && (
                <p>?儭?<span className="text-white/50">?脰?:</span> {currentAnalysis.defenseMechanisms.join(', ')}</p>
              )}
              <p>??<span className="text-white/50">?賡?:</span> {currentAnalysis.energyLevel}</p>
            </div>
          </div>
        </div>
      )}

      {/* ?喃?閫????蝷?*/}
      {messageCount >= 2 && !isLimitReached && (
        <div className="hidden sm:block fixed bottom-14 right-4 z-20 animate-fade-in">
          <div className="backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-2xl px-4 py-3 shadow-2xl max-w-xs">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">?儭?/span>
              <div className="flex-1">
                <p className="text-white/90 text-sm font-medium mb-0.5">?冽??舀?????/p>
                <p className="text-white/60 text-xs mb-2">?亦??桀?撠店???游???/p>
                <button
                  onClick={handleViewMindMap}
                  className="px-3 py-1 bg-purple-500/30 hover:bg-purple-500/40 border border-purple-400/30 rounded-lg text-white text-xs font-medium transition-all"
                >
                  蝡?亦? ??                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 銝餃摰孵? */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-2 sm:px-4 pt-10 sm:pt-16 pb-1 sm:pb-2 min-h-0">
        {/* 璅?? */}
        <div className="mb-2 sm:mb-3 text-center flex-shrink-0">
          <div className="hidden sm:block">
            <p className="text-xl font-light text-white">
              Aletheia ?踹?撣? <span className="text-white/50 mx-2">??/span> <span className="text-white/70">擐葉AI敹?撣?/span>
            </p>
            <p className="text-sm text-white/60 mt-0.5">
              摰?銝剔?敹?撠店 <span className="text-white/30 mx-2">??/span> ?嗅???:{intentNames[intent] || intent}
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              閮?賊?:{messageCount}/{MESSAGE_LIMIT}
            </p>
          </div>
          <p className="sm:hidden text-[11px] text-white/50">
            {messageCount}/{MESSAGE_LIMIT}
          </p>
        </div>

        {/* 撠店獢?*/}
        <div className="w-full max-w-3xl flex-1 min-h-0 flex flex-col backdrop-blur-md bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* 閮? */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[90%] sm:max-w-[85%] bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white backdrop-blur-sm border border-white/10 px-4 py-4 sm:px-6 sm:py-5 rounded-2xl">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="text-2xl sm:text-3xl mt-1">??/div>
                    <div className="flex-1">
                      <p className="text-sm sm:text-base mb-2 sm:mb-3 leading-relaxed">
                        雿末,? Aletheia??                      </p>
                      <p className="text-base sm:text-lg font-light mb-2 sm:mb-3 text-white">
                        隞予?唾?頝?隢?暻澆?
                      </p>
                      <p className="text-xs sm:text-sm text-white/70 mb-3 sm:mb-4 leading-relaxed">
                        雿隞交?甈脰?,?ㄐ?臬??函?蝛粹??隢?唳??????桃??唾?鋡怎?閫???券ㄐ?芯撈雿?                      </p>
                      <div className="pt-2 sm:pt-3 border-t border-white/10">
                        <p className="text-[10px] sm:text-xs text-white/50">
                          ? ???祥皜祈岫:瘥?閰望?憭?{MESSAGE_LIMIT} ????蝝?30-45 ??瘛勗漲撠店)
                        </p>
                        <p className="text-[10px] sm:text-xs text-white/40 mt-1">
                          ??儭?銝??嚗?撌虫?閫漸?◢?湔隤芾店
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
                  className={`max-w-[85%] sm:max-w-[80%] px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-white/10 text-white backdrop-blur-sm'
                      : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white backdrop-blur-sm border border-white/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{msg.content}</p>
                  <span className="text-[10px] sm:text-xs text-white/40 mt-1 sm:mt-2 block">
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
                <div className="max-w-[90%] sm:max-w-[85%] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-white backdrop-blur-sm border border-amber-400/30 px-4 py-4 sm:px-6 sm:py-6 rounded-2xl">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="text-2xl sm:text-3xl mt-1">??/div>
                    <div className="flex-1">
                      <p className="text-sm sm:text-base mb-2 sm:mb-3 leading-relaxed">
                        ??撠店?圈ㄐ??畾菔鈭?                      </p>
                      <p className="text-xs sm:text-sm text-white/80 mb-3 sm:mb-4 leading-relaxed">
                        ?券活瘛勗漲撠店銝???閬?雿??除??隤?銝?瘜?銝隞賣????賣雿敹?摰?銝?典???                      </p>
                      <p className="text-sm sm:text-base font-light mb-3 sm:mb-4 text-white">
                        ?? ?喟????箔??渡???????
                      </p>
                      <p className="text-[10px] sm:text-xs text-white/60 mb-4 sm:mb-5 leading-relaxed">
                        ?歇蝬??活撠店????頝～敹降憿???撖??閬死??敹??啣?,撟怠雿皜?啁?閬撌晞?                      </p>
                      <div className="flex flex-col space-y-2 sm:space-y-3">
                        <button
                          onClick={handleViewMindMap}
                          className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white text-sm sm:text-base font-medium transition-all flex items-center justify-center space-x-2"
                        >
                          <span>?儭?/span>
                          <span>?亦???敹??啣?</span>
                        </button>
                        <button
                          onClick={handleClearChat}
                          className="w-full px-4 py-2.5 sm:px-5 sm:py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 text-xs sm:text-sm transition-all"
                        >
                          ?? ?????啁?撠店
                        </button>
                      </div>
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                        <p className="text-[10px] sm:text-xs text-white/40 text-center">
                          ? 皜祈岫??摰?祥 繚 雿??梁?摰??霅?                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 頛詨? */}
          <div className="p-2 sm:p-4 border-t border-white/10 backdrop-blur-sm bg-white/5 flex-shrink-0">
            <div className="flex space-x-2 sm:space-x-3">
              {/* 暻亙?憸冽???*/}
              <button
                onClick={handleVoiceInput}
                disabled={isLoading || !sessionId || isLimitReached}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening
                    ? 'bg-red-500/40 border-red-400/50 text-white animate-pulse'
                    : 'bg-white/10 border-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
                title={isListening ? '暺??迫?' : '暺???隤頛詨'}
              >
                {isListening ? '?' : '??儭?}
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLimitReached ? '撌脤??啗??臭???..' : isListening ? '甇??...' : '?券ㄐ?澈雿??單?嚗?暺??隤芾店'}
                className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none backdrop-blur-sm border border-white/10"
                rows={1}
                style={{ maxHeight: '80px' }}
                disabled={isLoading || !sessionId || isLimitReached}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !sessionId || isLimitReached}
                className="px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                {isLoading ? '...' : '?潮?}
              </button>
            </div>

            {!isLimitReached && messageCount > 0 && (
              <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-white/40 text-center">
                ? {MESSAGE_LIMIT - messageCount} ????                {messageCount >= MESSAGE_LIMIT - 3 && (
                  <span className="text-yellow-400/60 ml-2">?? 敹怠????</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slide-down {
          animation: slide-down 0.6s ease-out forwards;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function TherapyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">??頛銝?..</div>
      </div>
    }>
      <TherapyContent />
    </Suspense>
  );
}
