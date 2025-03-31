import { createClientComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

/**
 * Next.js 15에서 비동기 cookies() 함수와 호환되는 Supabase 클라이언트를 생성합니다.
 * 이 함수는 createRouteHandlerClient를 감싸서 cookies()의 비동기 처리를 내부적으로 처리합니다.
 */
export async function createSupabaseClient() {
  const cookieStore = await cookies();
  
  // Supabase 클라이언트 생성 (@supabase/auth-helpers-nextjs는 아직 Next.js 15의 비동기 cookies()와 완전히 호환되지 않음)
  return createRouteHandlerClient({
    cookies: () => ({
      getAll: () => Array.from(cookieStore.getAll() || []),
      get: (name: string) => cookieStore.get(name)
    } as any)
  });
}

/**
 * Supabase 클라이언트를 생성하고 익명 접근(anon key)을 사용합니다.
 * 서버 컴포넌트(API 라우트)에서 사용하기 위한 함수입니다.
 */
export function createSupabaseClientAnon() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // 서비스 롤 키를 사용하여 RLS 정책을 우회합니다
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.');
    // 서비스 롤 키가 없으면 기본 anon 키를 대체로 사용
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  
  // 서비스 롤 키로 클라이언트 생성 (RLS 우회)
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * RLS 정책을 우회하는 Admin/Service 레벨 Supabase 클라이언트 생성
 * 이 클라이언트는 서버 사이드에서만 사용해야 합니다.
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
} 