// 情感到顏色的映射
export const emotionColorMap: Record<string, string> = {
  // 正面情感
  '平靜': '#6B9BD1',
  '喜悅': '#FFD700',
  '希望': '#98D8C8',
  '感激': '#F7B5CA',
  
  // 中性/探索
  '好奇': '#B19CD9',
  '困惑': '#A0AEC0',
  '未知': '#718096',
  
  // 負面情感
  '焦慮': '#FF8C42',
  '深層焦慮': '#FF8C42',
  '悲傷': '#4A5568',
  '深層悲傷': '#4A5568',
  '憤怒': '#E63946',
  '恐懼': '#2D3748',
  '羞愧': '#6B46C1',
  '孤獨': '#1A202C',
  
  // 複雜情感
  '矛盾': '#718096',
  '麻木': '#2D3748',
  '無力': '#4A5568',
  '自我貶抑': '#4A5568',
};

// 取得情感對應的顏色
export function getEmotionColor(emotion: string): string {
  // 移除可能的前後空白
  const cleanEmotion = emotion.trim();
  
  // 如果有完全匹配，直接回傳
  if (emotionColorMap[cleanEmotion]) {
    return emotionColorMap[cleanEmotion];
  }
  
  // 模糊匹配（如果情感文字包含關鍵字）
  if (cleanEmotion.includes('焦慮')) return emotionColorMap['焦慮'];
  if (cleanEmotion.includes('悲傷')) return emotionColorMap['悲傷'];
  if (cleanEmotion.includes('憤怒')) return emotionColorMap['憤怒'];
  if (cleanEmotion.includes('恐懼')) return emotionColorMap['恐懼'];
  if (cleanEmotion.includes('喜悅') || cleanEmotion.includes('開心')) return emotionColorMap['喜悅'];
  if (cleanEmotion.includes('平靜') || cleanEmotion.includes('放鬆')) return emotionColorMap['平靜'];
  
  // 預設顏色（灰藍色）
  return '#718096';
}

// 取得情感對應的 RGB 值
export function getEmotionRGB(emotion: string): { r: number; g: number; b: number } {
  const color = getEmotionColor(emotion);
  
  // 確保顏色格式正確
  if (!color || !color.startsWith('#') || color.length !== 7) {
    console.warn('⚠️ 無效的顏色格式:', color, '使用預設灰色');
    return { r: 113, g: 128, b: 150 }; // 預設灰色
  }
  
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  return { r, g, b };
}