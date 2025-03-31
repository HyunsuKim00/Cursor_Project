import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { postLikes, posts, users } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';

// 좋아요 API
export async function POST(request: Request) {
  try {
    // body : 클라이언트가 보낸 요청 데이터
    const body = await request.json();
    const { postId, action } = body;
    
    // 클라이언트 요청 검증
    if (!postId || !action) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' }, 
        { status: 400 }
      );
    }
    
    const authData = await auth();
    const userId = authData.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' }, 
        { status: 401 }
      );
    }
    
    // 사용자가 DB에 존재하는지 확인
    const userExists = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .then(res => res.length > 0);
      
    if (!userExists) {
      return NextResponse.json(
        { error: '데이터베이스에 사용자 정보가 없습니다. 새로고침 후 다시 시도해주세요.' }, 
        { status: 404 }
      );
    }
    
    // 트랜잭션 시작
    await db.transaction(async (tx) => {
      // 게시글이 존재하는지 확인
      const postExists = await tx.select({ id: posts.id })
        .from(posts)
        .where(eq(posts.id, postId))
        .then(res => res.length > 0);
      
      if (!postExists) {
        throw new Error('존재하지 않는 게시글입니다.');
      }
      
      if (action === 'like') {
        // 이미 좋아요를 눌렀는지 확인
        const existingLike = await tx.select()
          .from(postLikes)
          .where(
            and(
              eq(postLikes.postId, postId),
              eq(postLikes.userId, userId)
            )
          )
          .then(res => res[0]);
        
        if (existingLike) {
          return; // 이미 좋아요를 눌렀으면 아무것도 하지 않음
        }
        
        // 좋아요 추가
        await tx.insert(postLikes).values({
          userId,
          postId,
          createdAt: new Date()
        });
        
        // 게시글 좋아요 수 증가
        await tx.update(posts)
          .set({
            likesCount: sql`${posts.likesCount} + 1`
          })
          .where(eq(posts.id, postId));
      } else {
        // 좋아요 취소
        await tx.delete(postLikes)
          .where(
            and(
              eq(postLikes.postId, postId),
              eq(postLikes.userId, userId)
            )
          );
        
        // 게시글 좋아요 수 감소
        await tx.update(posts)
          .set({
            likesCount: sql`GREATEST(${posts.likesCount} - 1, 0)`
          })
          .where(eq(posts.id, postId));
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: action === 'like' ? '좋아요가 추가되었습니다.' : '좋아요가 취소되었습니다.' 
    });
    
  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 