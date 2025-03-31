import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { postScraps } from '@/db/schema';
import { createSupabaseClientAnon } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// 스크랩 API
export async function POST(request: Request) {
  try {
    const { postId, action } = await request.json();
    
    if (!postId) {
      return NextResponse.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 });
    }
    
    // Clerk 인증 정보 확인
    const authData = await auth();
    const clerkUserId = authData.userId;
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Clerk 인증에 실패했습니다. 로그인 상태를 확인해주세요.' }, { status: 401 });
    }
    
    // Supabase 클라이언트 생성 (익명 접근 - 인증 불필요)
    const supabase = createSupabaseClientAnon();
    
    // 사용자 ID는 Clerk에서 가져온 ID 사용
    const userId = clerkUserId;
    
    if (action === 'scrap') {
      try {
        // 스크랩 추가
        await db.insert(postScraps)
          .values({
            userId,
            postId,
          })
          .onConflictDoNothing();
        
        return NextResponse.json({ success: true, action: 'scrap' });
      } catch (error: any) {
        console.error('스크랩 추가 오류:', error);
        return NextResponse.json({ 
          error: '스크랩 추가 중 오류가 발생했습니다.', 
          details: error?.message || String(error) 
        }, { status: 400 });
      }
    } else {
      // 스크랩 취소
      try {
        const result = await db.delete(postScraps)
          .where(
            and(
              eq(postScraps.userId, userId),
              eq(postScraps.postId, postId)
            )
          );
        
        return NextResponse.json({ success: true, action: 'unscrap', count: result.count });
      } catch (error: any) {
        console.error('스크랩 취소 오류:', error);
        return NextResponse.json({ 
          error: '스크랩 취소 중 오류가 발생했습니다.', 
          details: error?.message || String(error) 
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('스크랩 처리 오류:', error);
    return NextResponse.json({ 
      error: '스크랩 처리 중 오류가 발생했습니다.', 
      details: error?.stack || error?.message || String(error) 
    }, { status: 500 });
  }
} 