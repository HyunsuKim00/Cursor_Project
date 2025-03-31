import { NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// 댓글 작성 API
export async function POST(request: Request) {
  try {
    const { postId, content } = await request.json();
    
    if (!postId || !content) {
      return NextResponse.json({ error: '게시글 ID와 내용은 필수입니다.' }, { status: 400 });
    }
    
    // Clerk 인증 확인
    const authData = await auth();
    const userId = authData.userId;
    
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 사용자가 DB에 존재하는지 확인
    const user = await db.select({ 
      username: users.username, 
      nickname: users.nickname 
    })
      .from(users)
      .where(eq(users.id, userId))
      .then(res => res[0]);
      
    if (!user) {
      return NextResponse.json(
        { error: '데이터베이스에 사용자 정보가 없습니다. 새로고침 후 다시 시도해주세요.' }, 
        { status: 404 }
      );
    }
    
    // 댓글 저장
    const [newComment] = await db.insert(comments)
      .values({
        content,
        postId,
        authorId: userId,
      })
      .returning();
    
    return NextResponse.json({
      id: newComment.id,
      content: newComment.content,
      authorId: newComment.authorId,
      author: user.nickname || user.username,
      date: newComment.createdAt,
      likes: 0,
      isLiked: false,
    });
    
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    return NextResponse.json({ error: '댓글 작성 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 