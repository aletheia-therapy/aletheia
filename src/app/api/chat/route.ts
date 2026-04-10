import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 🔥 新增：成本追蹤
let dailyTokenUsage = {
  date: new Date().toDateString(),
  inputTokens: 0,
  cacheCreationTokens: 0,
  cacheReadTokens: 0,
  outputTokens: 0,
  totalCostUSD: 0,
  apiCalls: 0,
};

// 🔥 新增：成本計算函數
function calculateCost(usage: any): number {
  // Claude Sonnet 4 定價（2025年4月）
  const PRICE_INPUT = 3.00 / 1_000_000;        // $3 per 1M tokens
  const PRICE_CACHE_WRITE = 3.75 / 1_000_000;  // $3.75 per 1M tokens
  const PRICE_CACHE_READ = 0.30 / 1_000_000;   // $0.30 per 1M tokens
  const PRICE_OUTPUT = 15.00 / 1_000_000;      // $15 per 1M tokens

  const inputCost = (usage.input_tokens || 0) * PRICE_INPUT;
  const cacheWriteCost = (usage.cache_creation_input_tokens || 0) * PRICE_CACHE_WRITE;
  const cacheReadCost = (usage.cache_read_input_tokens || 0) * PRICE_CACHE_READ;
  const outputCost = (usage.output_tokens || 0) * PRICE_OUTPUT;

  return inputCost + cacheWriteCost + cacheReadCost + outputCost;
}

// 🔥 新增：重置每日計數（如果日期改變）
function checkAndResetDaily() {
  const today = new Date().toDateString();
  if (dailyTokenUsage.date !== today) {
    console.log('📅 新的一天，重置計數器');
    console.log('📊 昨日總花費: $', dailyTokenUsage.totalCostUSD.toFixed(4), 'USD ≈ NT$', (dailyTokenUsage.totalCostUSD * 32).toFixed(2));
    dailyTokenUsage = {
      date: today,
      inputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      outputTokens: 0,
      totalCostUSD: 0,
      apiCalls: 0,
    };
  }
}

// 初始化 Anthropic 客戶端
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 初始化 Supabase 客戶端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 讀取 System Prompt
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'prompts', 'system_prompt.txt'),
  'utf-8'
);

// 意圖對應的溫度設定
const INTENT_TEMPERATURE_MAP: Record<string, number> = {
  explore: 0.8,
  solve: 0.5,
  understand: 0.7,
};

// XML 解析器函數
function parseAIAnalysis(content: string): {
  emotion: string;
  emotionIntensity: number;
  defenseMechanisms: string[];
  adlerianPurpose: string;
  activeTheories: string[];
  energyLevel: string;
  clinicalInsight: string;
  userResponse: string;
} {
  const analysisMatch = content.match(/<ai_analysis>([\s\S]*?)<\/ai_analysis>/);
  const responseMatch = content.match(/<response_to_user>([\s\S]*?)<\/response_to_user>/);

  if (!analysisMatch || !responseMatch) {
    console.warn('⚠️ 未找到 XML 標籤，使用預設值');
    console.log('📄 原始內容前 500 字:', content.substring(0, 500));
    return {
      emotion: '未知',
      emotionIntensity: 5,
      defenseMechanisms: [],
      adlerianPurpose: '未分析',
      activeTheories: [],
      energyLevel: '中能量',
      clinicalInsight: '無',
      userResponse: content,
    };
  }

  const analysisContent = analysisMatch[1];
  const userResponse = responseMatch[1].trim();

  const extractTag = (tagName: string): string => {
    const match = analysisContent.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`));
    return match ? match[1].trim() : '';
  };

  const parsed = {
    emotion: extractTag('emotion') || '未知',
    emotionIntensity: parseInt(extractTag('emotion_intensity')) || 5,
    defenseMechanisms: extractTag('defense_mechanisms')
      .split(',')
      .map(d => d.trim())
      .filter(d => d),
    adlerianPurpose: extractTag('adlerian_purpose') || '未分析',
    activeTheories: extractTag('active_theories')
      .split(',')
      .map(t => t.trim())
      .filter(t => t),
    energyLevel: extractTag('energy_level') || '中能量',
    clinicalInsight: extractTag('clinical_insight') || '無',
    userResponse,
  };

  console.log('✅ XML 解析成功:', {
    emotion: parsed.emotion,
    intensity: parsed.emotionIntensity,
    defenses: parsed.defenseMechanisms.length,
    theories: parsed.activeTheories.length,
  });

  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, intent } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: '缺少必要參數：message 或 sessionId' },
        { status: 400 }
      );
    }

    const temperature = INTENT_TEMPERATURE_MAP[intent] || 0.7;

    console.log('📨 收到訊息:', message);
    console.log('🔑 會話 ID:', sessionId);
    console.log('🎯 意圖:', intent, '| 溫度:', temperature);

    // 1. 儲存使用者訊息
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      });

    if (userMessageError) {
      console.error('❌ 儲存使用者訊息失敗:', userMessageError);
    }

    // 2. 獲取歷史對話
    const { data: historyData } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    const conversationHistory = historyData || [];

    // 3. 呼叫 Claude API（啟用 Prompt Caching）
    console.log('🤖 呼叫 Claude API（溫度:', temperature, '）...');
    console.log('💾 Prompt Caching 已啟用');
    
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: temperature,
      // 🔥 關鍵修改：改用陣列格式並加上快取標記
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: [
        ...conversationHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: message,
        },
      ],
    });

    // 🔍 檢查快取效果 + 成本追蹤
    if (response.usage) {
      // 重置每日計數（如果需要）
      checkAndResetDaily();

      // 計算本次成本
      const thisCost = calculateCost(response.usage);
      
      // 更新每日統計
      dailyTokenUsage.inputTokens += response.usage.input_tokens || 0;
      dailyTokenUsage.cacheCreationTokens += (response.usage as any).cache_creation_input_tokens || 0;
      dailyTokenUsage.cacheReadTokens += (response.usage as any).cache_read_input_tokens || 0;
      dailyTokenUsage.outputTokens += response.usage.output_tokens || 0;
      dailyTokenUsage.totalCostUSD += thisCost;
      dailyTokenUsage.apiCalls += 1;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Token 使用統計:');
      console.log('  - Input tokens:', response.usage.input_tokens);
      console.log('  - Cache creation tokens:', (response.usage as any).cache_creation_input_tokens || 0);
      console.log('  - Cache read tokens:', (response.usage as any).cache_read_input_tokens || 0);
      console.log('  - Output tokens:', response.usage.output_tokens);
      
      // 計算快取效果
      const cacheRead = (response.usage as any).cache_read_input_tokens || 0;
      if (cacheRead > 0) {
        console.log('✅ 快取命中！省了', cacheRead, 'tokens');
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💰 本次成本: $', thisCost.toFixed(4), 'USD ≈ NT$', (thisCost * 32).toFixed(2));
      console.log('📈 今日累計: $', dailyTokenUsage.totalCostUSD.toFixed(4), 'USD ≈ NT$', (dailyTokenUsage.totalCostUSD * 32).toFixed(2));
      console.log('📞 今日呼叫次數:', dailyTokenUsage.apiCalls);
      
      // 🔥 警告：接近每日上限
      const dailyCostNTD = dailyTokenUsage.totalCostUSD * 32;
      if (dailyCostNTD >= 100) {
        console.log('🚨🚨🚨 警告：今日花費已達 NT$100 上限！🚨🚨🚨');
      } else if (dailyCostNTD >= 80) {
        console.log('⚠️ 注意：今日花費已達 NT$', dailyCostNTD.toFixed(2), '（接近上限）');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // 4. 提取回應
    const rawContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    console.log('📥 Claude 原始回應長度:', rawContent.length, '字');

    // 5. 解析 XML
    const parsed = parseAIAnalysis(rawContent);

    console.log('🔍 解析結果:', {
      emotion: parsed.emotion,
      intensity: parsed.emotionIntensity,
      defenseMechanisms: parsed.defenseMechanisms,
      energyLevel: parsed.energyLevel,
      adlerianPurpose: parsed.adlerianPurpose,
      activeTheories: parsed.activeTheories,
    });

    // 6. 準備 metadata
    const metadata = {
      emotion: parsed.emotion,
      emotion_intensity: parsed.emotionIntensity,
      defense_mechanisms: parsed.defenseMechanisms,
      adlerian_purpose: parsed.adlerianPurpose,
      active_theories: parsed.activeTheories,
      energy_level: parsed.energyLevel,
      clinical_insight: parsed.clinicalInsight,
      intent: intent,
      temperature: temperature,
    };

    console.log('💾 準備儲存 metadata:', JSON.stringify(metadata, null, 2));

    // 7. 儲存 AI 回應（帶 metadata）
    const { data: savedMessage, error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: parsed.userResponse,
        metadata: metadata,
      })
      .select()
      .single();

    if (aiMessageError) {
      console.error('❌ 儲存 AI 訊息失敗:', aiMessageError);
      console.error('❌ 錯誤詳情:', JSON.stringify(aiMessageError, null, 2));
    } else {
      console.log('✅ AI 訊息已儲存，ID:', savedMessage?.id);
      console.log('✅ 儲存的 metadata:', savedMessage?.metadata);
    }

    // 8. 回傳給前端
    return NextResponse.json({
      message: parsed.userResponse,
      analysis: {
        emotion: parsed.emotion,
        emotionIntensity: parsed.emotionIntensity,
        defenseMechanisms: parsed.defenseMechanisms,
        adlerianPurpose: parsed.adlerianPurpose,
        activeTheories: parsed.activeTheories,
        energyLevel: parsed.energyLevel,
      },
    });

  } catch (error) {
    console.error('❌ API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}