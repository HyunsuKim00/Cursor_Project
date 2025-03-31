import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, desc, sql } from 'drizzle-orm';
import { posts, users, postScraps } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';

// 사용자가 스크랩한 게시물 가져오기 API
export async function GET() {
  try {
    // Clerk 인증 정보 확인
    const authData = await auth();
    const userId = authData.userId;
    
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 사용자가 스크랩한 게시물 ID 가져오기
    const scrapedPostIds = await db.select({
      postId: postScraps.postId
    })
    .from(postScraps)
    .where(eq(postScraps.userId, userId));
    
    // 스크랩한 게시물이 없는 경우 빈 배열 반환
    if (!scrapedPostIds.length) {
      return NextResponse.json([]);
    }
    
    // 스크랩한 게시물 ID 배열 생성
    const postIds = scrapedPostIds.map(item => item.postId);
    
    // 스크랩한 게시물 정보 가져오기
    const scrapedPosts = await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      author: sql`COALESCE(${users.nickname}, ${users.username})`,
      authorId: posts.authorId,
      createdAt: posts.createdAt,
      likes: posts.likesCount,
      category: posts.category,
      imageUrl: posts.imageUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(
      // 스크랩한 게시물 ID 배열에 포함된 게시물 필터링
      sql`${posts.id} IN (${postIds.join(',')})`
    )
    .orderBy(desc(posts.createdAt));
    
    // 스크랩 상태 정보 추가
    const postsWithScrapInfo = scrapedPosts.map(post => ({
      ...post,
      isScraped: true
    }));
    
    return NextResponse.json(postsWithScrapInfo);
    
  } catch (error) {
    console.error('스크랩한 게시물 가져오기 오류:', error);
    return NextResponse.json({ error: '스크랩한 게시물을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 