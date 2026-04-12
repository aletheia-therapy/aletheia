'use client';

import { getEmotionColor } from '@/lib/emotion-map';

interface EmotionIndicatorProps {
  emotion: string;
}

export function EmotionIndicator({ emotion }: EmotionIndicatorProps) {
  const color = getEmotionColor(emotion);

  return (
    <div className="fixed top-8 right-8 z-20">
      <div className="flex items-center space-x-3 backdrop-blur-md bg-white/5 px-5 py-3 rounded-full border border-white/10">
        {/* 情感光球 */}
        <div
          className="w-4 h-4 rounded-full shadow-lg transition-all duration-1000"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}`,
          }}
        />
        
        {/* 情感文字 */}
        <span className="text-white/80 text-sm font-light">
          {emotion}
        </span>
      </div>
    </div>
  );
}