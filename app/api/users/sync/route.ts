import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    // Clerk 인증 확인
    const authData = await auth();
    const authUserId = authData.userId;
    
    if (!authUserId) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 요청 본문 파싱
    const { userId, firstName, lastName, username, email } = await request.json();
    
    // 인증된 사용자와 요청의 사용자 ID가 일치하는지 확인
    if (authUserId !== userId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }
    
    // 사용자가 이미 존재하는지 확인
    const existingUser = await db
      .select({
        id: users.id,
        username: users.username,
        nickname: users.nickname
      })
      .from(users)
      .where(eq(users.id, userId))
      .then(res => res[0]);
    
    // 닉네임 생성 (firstName + lastName 조합)
    const generatedNickname = `${firstName || ''} ${lastName || ''}`.trim() || `사용자_${userId.substring(0, 5)}`;
    
    if (existingUser) {
      // 기존 사용자 업데이트 - username은 변경하지 않고 nickname만 업데이트
      const updateData = {
        email: email || 'unknown@example.com',
        // 닉네임은 사용자가 설정한 값이 있으면 유지, 없으면 새로 생성된 값 사용
        nickname: existingUser.nickname || generatedNickname
      };
      
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      
      console.log('사용자 정보 업데이트:', userId);
      return NextResponse.json({ success: true, message: '사용자 정보가 업데이트되었습니다.' });
    } else {
      // 새 사용자 추가
      const newUserData = {
        id: userId,
        username: username || `user_${userId.substring(0, 8)}`,
        email: email || 'unknown@example.com',
        nickname: generatedNickname
      };
      
      await db
        .insert(users)
        .values(newUserData);
      
      console.log('새 사용자 추가:', userId);
      return NextResponse.json({ success: true, message: '새 사용자가 추가되었습니다.' });
    }
    
  } catch (error) {
    console.error('사용자 동기화 오류:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '사용자 정보 동기화 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 