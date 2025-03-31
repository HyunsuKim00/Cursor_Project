import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseClient, createSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    
    // 제목과 내용 확인
    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 });
    }
    
    // Clerk에서 사용자 정보 가져오기
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 비동기 Supabase 클라이언트 생성
    const supabase = await createSupabaseClient();
    
    // 관리자 권한으로 RLS를 우회하는 클라이언트 생성
    const supabaseAdmin = createSupabaseAdmin();
    
    // 사용자 데이터 조회 (username 가져오기)
    let { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();
    
    // 사용자 정보가 없으면 새로 생성
    if (userDataError) {
      // 사용자 정보 삽입 (관리자 클라이언트 사용)
      const { data: newUserData, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          username: user.username || user.firstName || 'user_' + user.id.substring(0, 8),
          email: user.emailAddresses[0]?.emailAddress || 'unknown@example.com',
          nickname: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('사용자 정보 생성 오류:', insertError);
        return NextResponse.json({ error: '사용자 정보를 생성하는데 실패했습니다.' }, { status: 500 });
      }
      
      // 새로 생성된 사용자 정보 사용
      userData = newUserData;
    }
    
    // userData가 null이면 오류 반환
    if (!userData) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 게시글을 데이터베이스에 저장 (관리자 클라이언트 사용하여 RLS 정책 우회)
    const { data: postData, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        title,
        content,
        image_url: null, // 이미지 없음
        author_id: user.id
      })
      .select()
      .single();
    
    if (postError) {
      console.error('게시글 저장 오류:', postError);
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, post: postData });
  } catch (error) {
    console.error('게시글 작성 오류:', error);
    return NextResponse.json({ error: '게시글 작성 중 오류가 발생했습니다' }, { status: 500 });
  }
} 