import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// 게시글 업데이트에 사용할 데이터 타입 정의
interface UpdateData {
  title: string;
  content: string;
  updated_at: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // params 비동기 처리
    const { id } = await params;
    const postId = Number(id);
    
    if (isNaN(postId)) {
      return NextResponse.json({ error: '유효하지 않은 게시글 ID입니다.' }, { status: 400 });
    }
    
    // 사용자 인증 확인
    const authData = await auth();
    const userId = authData.userId;
    
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // Supabase 관리자 클라이언트 생성 (RLS 정책 우회)
    const supabaseAdmin = createSupabaseAdmin();
    
    // FormData 파싱
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    
    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용은 필수 입력사항입니다.' }, { status: 400 });
    }
    
    // 게시글 작성자 확인 (관리자 클라이언트 사용)
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();
      
    if (postError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    if (post.author_id !== userId) {
      return NextResponse.json({ error: '본인이 작성한 게시글만 수정할 수 있습니다.' }, { status: 403 });
    }
    
    // 게시글 업데이트 (관리자 클라이언트 사용)
    const updateData: UpdateData = {
      title,
      content,
      updated_at: new Date().toISOString(),
    };
    
    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update(updateData)
      .eq('id', postId);
    
    if (updateError) {
      console.error('게시글 업데이트 오류:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '게시글이 성공적으로 수정되었습니다.',
    });
    
  } catch (error) {
    console.error('게시글 수정 오류:', error);
    return NextResponse.json({ error: '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 