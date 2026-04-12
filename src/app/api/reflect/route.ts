// src/app/api/reflect/route.ts
// 🧠 Aletheia 自我反思 API
// 使用 Haiku 模型（低成本）回顧對話、萃取經驗、標記未知概念

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REFLECTION_PROMPT = `你是 Aletheia 阿勒希雅的「督導心理師」。你的任務是回顧一段心理諮商對話，進行嚴格但建設性的自我評估。

【評估標準】
有效的回應特徵：
- 使用者在之後的訊息變得更長、更深入
- 使用者出現頓悟詞（「對」「其實」「我發現」「原來」「你說得對」「我從來沒這樣想過」）
- 使用者情感從防衛轉為脆弱（憤怒→悲傷、焦慮→釋然）
- 使用者主動延伸話題而非轉移

無效的回應特徵：
- 使用者變得敷衍、簡短、轉移話題
- 使用者表達不被理解（「你不懂」「算了」）
- 過度說教、給出罐頭式建議
- 引用理論但脫離使用者的真實情境

【未知概念偵測】
檢查使用者提到的以下內容是否 AI 可能不熟悉：
- 特定人名（網紅、小眾學者、使用者的親友名字除外）
- 專業術語（非主流心理學/醫學/哲學/宗教概念）
- 近期事件（作品、新聞、流行文化）
- 非主流理論流派

【輸出格式】
必須嚴格回傳以下 JSON 格式，不要任何額外文字，不要 markdown 程式碼圍欄：

{
  "overall_quality": 1到10的整數,
  "what_worked": "這次對話中哪些回應策略有效，具體描述",
  "what_failed": "哪些回應不夠好或可以更好",
  "user_opening_signals": "使用者展現了哪些敞開訊號",
  "user_resistance_signals": "使用者展現了哪些抗拒訊號",
  "lessons_learned": "下次遇到類似情境可以怎麼做更好",
  "good_responses": [
    {
      "user_context": "使用者當時說的話（濃縮版，50字內）",
      "context_keywords": ["關鍵字1", "關鍵字2", "關鍵字3", "關鍵字4", "關鍵字5"],
      "emotion_tag": "當時的主要情感（如：焦慮/悲傷/憤怒/困惑/孤獨）",
      "ai_response": "阿勒希雅當時有效的回應（可以是完整句或關鍵片段）",
      "response_strategy": "使用的流派（如：榮格原型/CBT認知重建/阿德勒目的論/存在主義/精神分析/反映式傾聽）",
      "effectiveness_score": 7到10的整數,
      "effectiveness_reason": "為什麼這個回應有效"
    }
  ],
  "unknown_concepts": [
    {
      "concept": "具體的詞彙或人名",
      "concept_type": "person/term/event/theory/other",
      "user_context": "使用者提到時的前後文",
      "ai_handling": "當時 AI 如何處理"
    }
  ]
}

【重要規則】
- good_responses 只收錄 effectiveness_score >= 7 的回應
- 如果這次對話整體品質差，good_responses 可以是空陣列
- 如果使用者沒提到任何未知概念，unknown_concepts 可以是空陣列
- context_keywords 必須包含 3-6 個最能代表情境的中文關鍵字
- 不要編造內容，只根據實際對話評估`;

export async function POST(request: NextRequest) {
  try {
    const { sessionId, messages } = await request.json();

    if (!sessionId || !messages || !Array.isArray(messages) || messages.length < 4) {
      return NextResponse.json(
        { error: '資料不足，無法進行反思' },
        { status: 400 }
      );
    }

    // 將對話整理成給 Haiku 閱讀的格式
    const conversationText = messages
      .map((m: { role: string; content: string }, i: number) => {
        const speaker = m.role === 'user' ? '【使用者】' : '【阿勒希雅】';
        return `${i + 1}. ${speaker}${m.content}`;
      })
      .join('\n\n');

    // 呼叫 Haiku 進行反思
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2500,
      system: REFLECTION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `請回顧以下這段心理諮商對話，並依照指定 JSON 格式輸出反思結果：\n\n${conversationText}`,
        },
      ],
    });

    // 解析 Haiku 的回應
    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // 清理可能的 markdown 圍欄
    const cleanText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let reflection;
    try {
      reflection = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Haiku 回傳格式解析失敗:', rawText);
      return NextResponse.json(
        { error: '反思結果解析失敗', raw: rawText },
        { status: 500 }
      );
    }

    // 成本估算顯示
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const costUSD = (inputTokens * 0.8 + outputTokens * 4) / 1_000_000;
    const costTWD = costUSD * 32;
    console.log(
      `🧠 反思完成 | 輸入 ${inputTokens} | 輸出 ${outputTokens} | 成本約 NT$${costTWD.toFixed(4)}`
    );

    // ========= 寫入 Supabase =========

    // 1. 寫入 session_reflections
    const { error: reflectionError } = await supabase
      .from('session_reflections')
      .insert({
        session_id: sessionId,
        overall_quality: reflection.overall_quality,
        what_worked: reflection.what_worked,
        what_failed: reflection.what_failed,
        user_opening_signals: reflection.user_opening_signals,
        user_resistance_signals: reflection.user_resistance_signals,
        lessons_learned: reflection.lessons_learned,
      });

    if (reflectionError) {
      console.error('❌ 寫入反思報告失敗:', reflectionError);
    }

    // 2. 寫入 good_responses
    if (Array.isArray(reflection.good_responses) && reflection.good_responses.length > 0) {
      const goodResponsesData = reflection.good_responses
        .filter((r: { effectiveness_score: number }) => r.effectiveness_score >= 7)
        .map((r: {
          user_context: string;
          context_keywords: string[];
          emotion_tag: string;
          ai_response: string;
          response_strategy: string;
          effectiveness_score: number;
          effectiveness_reason: string;
        }) => ({
          session_id: sessionId,
          user_context: r.user_context,
          context_keywords: r.context_keywords,
          emotion_tag: r.emotion_tag,
          ai_response: r.ai_response,
          response_strategy: r.response_strategy,
          effectiveness_score: r.effectiveness_score,
          effectiveness_reason: r.effectiveness_reason,
        }));

      if (goodResponsesData.length > 0) {
        const { error: goodRespError } = await supabase
          .from('good_responses')
          .insert(goodResponsesData);
        if (goodRespError) {
          console.error('❌ 寫入優質回應失敗:', goodRespError);
        } else {
          console.log(`✅ 新增 ${goodResponsesData.length} 筆優質回應`);
        }
      }
    }

    // 3. 寫入 unknown_concepts（去重處理）
    if (Array.isArray(reflection.unknown_concepts) && reflection.unknown_concepts.length > 0) {
      for (const concept of reflection.unknown_concepts) {
        const { data: existing } = await supabase
          .from('unknown_concepts')
          .select('id, times_encountered')
          .eq('concept', concept.concept)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('unknown_concepts')
            .update({ times_encountered: existing.times_encountered + 1 })
            .eq('id', existing.id);
        } else {
          await supabase.from('unknown_concepts').insert({
            session_id: sessionId,
            concept: concept.concept,
            concept_type: concept.concept_type,
            user_context: concept.user_context,
            ai_handling: concept.ai_handling,
          });
        }
      }
      console.log(`✅ 處理 ${reflection.unknown_concepts.length} 個未知概念`);
    }

    return NextResponse.json({
      success: true,
      reflection: {
        quality: reflection.overall_quality,
        goodResponsesCount: reflection.good_responses?.length || 0,
        unknownConceptsCount: reflection.unknown_concepts?.length || 0,
      },
      cost: costTWD,
    });
  } catch (error) {
    console.error('❌ 反思 API 錯誤:', error);
    return NextResponse.json(
      { error: '反思失敗', detail: String(error) },
      { status: 500 }
    );
  }
}