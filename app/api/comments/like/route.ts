import { NextResponse } from 'next/server';
import { db } from '@/db';
import { commentLikes, comments, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// 댓글 좋아요 API
export async function POST(request: Request) {
  try {
    // 요청 본문 파싱
    const { commentId, action } = await request.json();
    
    // 필수 파라미터 검증
    if (!commentId || !action) {
      return NextResponse.json(
        { error: '댓글 ID와 액션은 필수입니다.' }, 
        { status: 400 }
      );
    }
    
    if (action !== 'like' && action !== 'unlike') {
      return NextResponse.json(
        { error: '액션은 like 또는 unlike만 가능합니다.' }, 
        { status: 400 }
      );
    }
    
    // 사용자 인증 확인
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
      // 댓글이 존재하는지 확인
      const commentExists = await tx.select({ id: comments.id })
        .from(comments)
        .where(eq(comments.id, commentId))
        .then(res => res.length > 0);
      
      if (!commentExists) {
        throw new Error('존재하지 않는 댓글입니다.');
      }
      
      if (action === 'like') {
        // 이미 좋아요를 눌렀는지 확인
        const existingLike = await tx.select()
          .from(commentLikes)
          .where(
            and(
              eq(commentLikes.commentId, commentId),
              eq(commentLikes.userId, userId)
            )
          )
          .then(res => res[0]);
        
        if (existingLike) {
          return; // 이미 좋아요를 눌렀으면 아무것도 하지 않음
        }
        
        // 좋아요 추가
        await tx.insert(commentLikes).values({
          userId,
          commentId,
          createdAt: new Date()
        });
        
        // 댓글 좋아요 수 증가
        await tx.update(comments)
          .set({
            likesCount: sql`${comments.likesCount} + 1`
          })
          .where(eq(comments.id, commentId));
      } else {
        // 좋아요 취소
        await tx.delete(commentLikes)
          .where(
            and(
              eq(commentLikes.commentId, commentId),
              eq(commentLikes.userId, userId)
            )
          );
        
        // 댓글 좋아요 수 감소
        await tx.update(comments)
          .set({
            likesCount: sql`GREATEST(${comments.likesCount} - 1, 0)`
          })
          .where(eq(comments.id, commentId));
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: action === 'like' ? '댓글에 좋아요가 추가되었습니다.' : '댓글 좋아요가 취소되었습니다.' 
    });
    
  } catch (error) {
    console.error('댓글 좋아요 처리 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '댓글 좋아요 처리 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 