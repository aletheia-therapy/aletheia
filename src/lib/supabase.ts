import { createClient } from '@supabase/supabase-js';

// 客戶端使用的 Supabase（瀏覽器端安全）
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 伺服器端使用的 Supabase（僅在 API 路由中使用）
// 注意：這個只能在 Node.js 環境（API 路由）中使用，不能在客戶端使用
export function createServerSupabase() {
  if (typeof window !== 'undefined') {
    throw new Error('createServerSupabase can only be used on the server side');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}