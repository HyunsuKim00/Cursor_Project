import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// 스크랩 API
export async function POST(request: Request) {
  try {
    const { postId, action } = await request.json();
    
    if (!postId) {
      return NextResponse.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 });
    }
    
    // 인증 확인
    const authData = await auth();
    const userId = authData.userId;
    
    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    // Supabase 관리자 권한으로 RLS 우회
    const supabaseAdmin = createSupabaseAdmin();
    
    // 스크랩 액션 확인
    const isScrapAction = action === 'scrap';
    
    if (isScrapAction) {
      // 스크랩 추가
      const { error: insertError } = await supabaseAdmin
        .from('post_scraps')
        .insert({
          user_id: userId,
          post_id: postId
        });
      
      if (insertError) {
        if (insertError.code === '23505') { // 중복 키 오류
          return NextResponse.json({
            error: '이미 스크랩한 게시글입니다.',
            isScraped: true
          }, { status: 400 });
        }
        
        throw insertError;
      }
      
      return NextResponse.json({
        message: '게시글을 스크랩했습니다.',
        isScraped: true
      });
      
    } else {
      // 스크랩 취소
      const { error: deleteError } = await supabaseAdmin
        .from('post_scraps')
        .delete()
        .match({ user_id: userId, post_id: postId });
      
      if (deleteError) {
        throw deleteError;
      }
      
      return NextResponse.json({
        message: '게시글 스크랩을 취소했습니다.',
        isScraped: false
      });
    }
    
  } catch (error) {
    console.error('스크랩 처리 오류:', error);
    
    // 타입 가드를 사용하여 any 타입 회피
    const errorMessage = error instanceof Error ? error.message : '스크랩 처리 중 오류가 발생했습니다.';
    
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
} 