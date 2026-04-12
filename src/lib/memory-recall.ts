// src/lib/memory-recall.ts
// 🧠 Aletheia 記憶檢索系統
// 從過去對話累積的「優質回應資料庫」中檢索相關經驗

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 從使用者訊息中萃取關鍵字（簡易版中文分詞）
function extractKeywords(text: string): string[] {
  const cleaned = text.replace(/[，。！？、；：""''（）【】\s]+/g, ' ').trim();
  
  // 情感詞庫
  const emotionWords = [
    '焦慮', '憂鬱', '悲傷', '憤怒', '恐懼', '孤獨', '絕望', '羞愧',
    '內疚', '嫉妒', '空虛', '麻木', '崩潰', '疲憊', '痛苦', '無助',
    '失望', '後悔', '困惑', '迷茫', '挫折', '委屈', '不甘',
  ];
  
  // 關係詞庫
  const relationWords = [
    '父親', '母親', '爸爸', '媽媽', '家人', '伴侶', '男友', '女友',
    '老公', '老婆', '丈夫', '妻子', '孩子', '朋友', '同事', '主管',
    '老師', '前任',
  ];
  
  // 議題詞庫
  const themeWords = [
    '工作', '失業', '分手', '離婚', '背叛', '出軌', '死亡', '生病',
    '自殺', '自我懷疑', '完美主義', '拖延', '失眠', '夢', '童年',
    '創傷', '虐待', '霸凌', '依賴', '控制', '邊界', '信任', '放手',
    '價值', '意義',
  ];
  
  const keywords: string[] = [];
  const allKeywords = [...emotionWords, ...relationWords, ...themeWords];
  
  for (const word of allKeywords) {
    if (cleaned.includes(word)) {
      keywords.push(word);
    }
  }
  
  return keywords;
}

export interface RecalledMemory {
  user_context: string;
  ai_response: string;
  response_strategy: string;
  emotion_tag: string;
  effectiveness_reason: string;
}

/**
 * 從優質回應資料庫中檢索相關經驗
 */
export async function recallSimilarExperiences(
  userMessage: string,
  limit: number = 3
): Promise<RecalledMemory[]> {
  try {
    const keywords = extractKeywords(userMessage);
    
    if (keywords.length === 0) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('good_responses')
      .select('user_context, ai_response, response_strategy, emotion_tag, effectiveness_reason, effectiveness_score, id')
      .overlaps('context_keywords', keywords)
      .order('effectiveness_score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('❌ 記憶檢索失敗:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // 累加被參考的次數（非同步，不等待結果）
    const ids = data.map(d => d.id);
    supabase
      .rpc('increment_referenced_count', { response_ids: ids })
      .then(() => {});
    
    console.log(`🧠 檢索到 ${data.length} 筆相關經驗 | 關鍵字: ${keywords.join(', ')}`);
    
    return data.map(d => ({
      user_context: d.user_context,
      ai_response: d.ai_response,
      response_strategy: d.response_strategy,
      emotion_tag: d.emotion_tag,
      effectiveness_reason: d.effectiveness_reason,
    }));
  } catch (err) {
    console.error('❌ recallSimilarExperiences 錯誤:', err);
    return [];
  }
}

/**
 * 將檢索到的經驗格式化為 System Prompt 可用的文字區塊
 */
export function formatMemoriesForPrompt(memories: RecalledMemory[]): string {
  if (memories.length === 0) {
    return '';
  }
  
  const memoryBlocks = memories
    .map(
      (m, i) => `
【經驗 ${i + 1}】
情境：${m.user_context}
當時使用的流派：${m.response_strategy}
情感狀態：${m.emotion_tag}
有效的回應方向：${m.ai_response}
為何有效：${m.effectiveness_reason}`
    )
    .join('\n');
  
  return `
---
🧠 【來自過往對話的經驗參考】
以下是你在過往類似情境中，被督導評估為有效的回應策略。請將這些經驗作為參考，但不要照搬——每個使用者都是獨特的，你要根據當前情境靈活運用。
${memoryBlocks}
---
`;
}