import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { auth, currentUser } from '@clerk/nextjs/server';

// 사용자 닉네임 업데이트 API
export async function POST(request: Request) {
  try {
    const { nickname } = await request.json();
    
    if (!nickname || nickname.trim() === '') {
      return NextResponse.json({ error: '닉네임은 필수 항목입니다.' }, { status: 400 });
    }
    
    // Clerk 인증 정보 확인
    const authData = await auth();
    const userId = authData.userId;
    
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // Clerk에서 현재 사용자 정보 가져오기
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress || 'unknown@example.com';
    
    // 사용자 정보 조회
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (existingUser.length === 0) {
      // 사용자가 존재하지 않는 경우 새로 생성
      // username은 고유한 식별자로 유지하고, nickname은 사용자 설정값으로 사용
      const username = user?.username || 
                       `user_${userId.substring(0, 8)}`;
      
      await db.insert(users)
        .values({
          id: userId,
          username: username,
          nickname: nickname,
          email: email,
        });
      
      return NextResponse.json({ success: true, message: '사용자 정보가 생성되었습니다.' });
    } else {
      // 기존 사용자 정보 업데이트 - nickname만 업데이트
      await db.update(users)
        .set({ 
          nickname: nickname,
          email: email,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      return NextResponse.json({ success: true, message: '닉네임이 업데이트되었습니다.' });
    }
    
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error);
    return NextResponse.json({ error: '사용자 정보 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 