import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: '請提供訊息' },
        { status: 400 }
      );
    }

    // 讀取 System Prompt
    const fs = require('fs');
    const path = require('path');
    const systemPrompt = fs.readFileSync(
      path.join(process.cwd(), 'prompts', 'system_prompt.txt'),
      'utf-8'
    );

    // 調用 Claude API（使用 System Prompt）
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    // 提取回應文本
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '無法獲取回應';

    return NextResponse.json({
      success: true,
      response: responseText,
    });

  } catch (error: any) {
    console.error('Claude API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '伺服器錯誤' 
      },
      { status: 500 }
    );
  }
}