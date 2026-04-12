// 訊息角色
export type MessageRole = 'user' | 'assistant';

// 情感類型（8 種基本情感）
export type EmotionType = 
  | 'joy'       // 喜悅
  | 'sadness'   // 悲傷
  | 'anger'     // 憤怒
  | 'fear'      // 恐懼
  | 'anxiety'   // 焦慮
  | 'calm'      // 平靜
  | 'confusion' // 困惑
  | 'hope';     // 希望

// 防衛機制類型
export type DefenseMechanism =
  | 'denial'              // 否認
  | 'rationalization'     // 合理化
  | 'projection'          // 投射
  | 'displacement'        // 轉移
  | 'regression'          // 退化
  | 'repression'          // 壓抑
  | 'sublimation'         // 昇華
  | 'intellectualization' // 理智化
  | 'reaction_formation'  // 反向作用
  | 'identification'      // 認同
  | 'fantasy'             // 幻想
  | 'humor'               // 幽默
  | 'passive_aggression'  // 被動攻擊
  | 'splitting'           // 分裂
  | 'idealization'        // 理想化
  | 'devaluation'         // 貶低
  | 'acting_out'          // 行動化
  | 'isolation'           // 隔離
  | 'undoing'             // 抵消
  | 'somatization';       // 身體化

// 訊息接口
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  
  // AI 分析結果（僅 assistant 訊息）
  analysis?: {
    emotions: {
      primary: EmotionType;
      secondary?: EmotionType;
      intensity: number; // 0-1
    };
    defenses?: {
      mechanism: DefenseMechanism;
      confidence: number; // 0-1
      evidence: string;
    }[];
    intervention_depth: 1 | 2 | 3 | 4 | 5;
  };
}

// 諮商意圖類型
export type TherapyIntent = 
  | 'explore'     // 自我探索
  | 'resolve'     // 問題解決
  | 'understand'; // 理解模式

// 會話狀態
export interface TherapySession {
  id: string;
  intent: TherapyIntent;
  temperature: number;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// API 請求
export interface ChatRequest {
  sessionId: string;
  message: string;
  intent: TherapyIntent;
}

// API 回應
export interface ChatResponse {
  success: boolean;
  message?: Message;
  error?: string;
}