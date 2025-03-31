import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, sql, and } from 'drizzle-orm';
import { posts, users, comments, postLikes, postScraps, commentLikes } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';

// 특정 게시글 가져오기 API
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // params를 await로 처리
    const { id } = await params;
    const postId = Number(id);
    
    if (isNaN(postId)) {
      return NextResponse.json({ error: '유효하지 않은 게시글 ID입니다.' }, { status: 400 });
    }
    
    // 게시글 정보 가져오기
    const postData = await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      author: sql`COALESCE(${users.nickname}, ${users.username})`,
      authorId: posts.authorId,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      category: posts.category,
      likes: posts.likesCount,
      imageUrl: posts.imageUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId));
    
    if (!postData || postData.length === 0) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    const post = postData[0];
    
    // 게시글 댓글 가져오기
    const commentsData = await db.select({
      id: comments.id,
      content: comments.content,
      author: sql`COALESCE(${users.nickname}, ${users.username})`,
      authorId: comments.authorId,
      createdAt: comments.createdAt,
      likes: comments.likesCount,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId));
    
    // Clerk 인증 정보 확인
    const authData = await auth();
    const userId = authData.userId;
    
    let isLiked = false;
    let isScraped = false;
    
    // 댓글 좋아요 상태 확인을 위한 배열
    let commentsWithLikeStatus = commentsData;
    
    if (userId) {
      // 사용자가 게시글을 좋아요했는지 확인
      const likeData = await db.select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, userId)
          )
        );
      
      isLiked = likeData.length > 0;
      
      // 사용자가 게시글을 스크랩했는지 확인
      const scrapData = await db.select()
        .from(postScraps)
        .where(
          and(
            eq(postScraps.postId, postId),
            eq(postScraps.userId, userId)
          )
        );
      
      isScraped = scrapData.length > 0;
      
      // 사용자가 댓글에 좋아요했는지 확인
      if (commentsData.length > 0) {
        // 댓글 ID 배열 추출
        const commentIds = commentsData.map(comment => comment.id);
        
        // 사용자가 좋아요한 댓글 목록 가져오기
        const commentLikesData = await db.select({
          commentId: commentLikes.commentId
        })
        .from(commentLikes)
        .where(
          and(
            eq(commentLikes.userId, userId),
            sql`${commentLikes.commentId} IN (${commentIds.join(',')})`
          )
        );
        
        // 좋아요한 댓글 ID를 Set으로 변환하여 빠른 조회 가능하게 함
        const likedCommentIds = new Set(commentLikesData.map(item => item.commentId));
        
        // 댓글 데이터에 좋아요 상태 추가
        commentsWithLikeStatus = commentsData.map(comment => ({
          ...comment,
          isLiked: likedCommentIds.has(comment.id)
        }));
      }
    } else {
      // 로그인하지 않은 사용자는 모든 댓글 좋아요 상태가 false
      commentsWithLikeStatus = commentsData.map(comment => ({
        ...comment,
        isLiked: false
      }));
    }
    
    const result = {
      ...post,
      comments: commentsWithLikeStatus,
      isLiked,
      isScraped,
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('게시글 상세 가져오기 오류:', error);
    return NextResponse.json({ error: '게시글을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 게시글 삭제 API
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // params를 await로 처리
    const { id } = await params;
    const postId = Number(id);
    
    if (isNaN(postId)) {
      return NextResponse.json({ error: '유효하지 않은 게시글 ID입니다.' }, { status: 400 });
    }
    
    // Clerk 인증 정보 확인
    const authData = await auth();
    const userId = authData.userId;
    
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 게시글 작성자 확인
    const postAuthor = await db.select({ authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    
    if (!postAuthor.length) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 작성자와 현재 사용자가 일치하는지 확인
    if (postAuthor[0].authorId !== userId) {
      return NextResponse.json({ error: '이 게시글을 삭제할 권한이 없습니다.' }, { status: 403 });
    }
    
    // 트랜잭션으로 게시글 관련 데이터 모두 삭제
    await db.transaction(async (tx) => {
      // 관련 댓글 좋아요 삭제
      await tx.delete(commentLikes)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${comments} 
            WHERE ${comments.postId} = ${postId} 
            AND ${commentLikes.commentId} = ${comments.id}
          )`
        );
      
      // 관련 댓글 삭제
      await tx.delete(comments)
        .where(eq(comments.postId, postId));
      
      // 게시글 좋아요 삭제
      await tx.delete(postLikes)
        .where(eq(postLikes.postId, postId));
      
      // 게시글 스크랩 삭제
      await tx.delete(postScraps)
        .where(eq(postScraps.postId, postId));
      
      // 게시글 삭제
      await tx.delete(posts)
        .where(eq(posts.id, postId));
    });
    
    return NextResponse.json({ success: true, message: '게시글이 삭제되었습니다.' });
    
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    return NextResponse.json({ error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 