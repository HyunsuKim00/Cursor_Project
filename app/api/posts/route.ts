import { NextResponse } from 'next/server';
import { db } from '@/db';
import { asc, desc, eq, gte, sql, and } from 'drizzle-orm';
import { posts, users, comments, postLikes, postScraps } from '@/db/schema';
import { createSupabaseClientAnon } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// 게시글 목록 가져오기 API
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParamsObj = await url.searchParams;
    const filter = searchParamsObj.get('filter') || 'new';
    
    // 쿼리 실행
    let postsData;
    
    // 필터에 따라 다른 쿼리 적용
    if (filter === 'hot') {
      postsData = await db.select({
        id: posts.id,
        title: posts.title,
        author: sql`COALESCE(${users.nickname}, ${users.username})`,
        authorId: posts.authorId,
        date: posts.createdAt,
        likes: posts.likesCount,
        category: posts.category,
        imageUrl: posts.imageUrl,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(gte(posts.likesCount, 10))
      .orderBy(desc(posts.createdAt));
    } else if (filter === 'best') {
      postsData = await db.select({
        id: posts.id,
        title: posts.title,
        author: sql`COALESCE(${users.nickname}, ${users.username})`,
        authorId: posts.authorId,
        date: posts.createdAt,
        likes: posts.likesCount,
        category: posts.category,
        imageUrl: posts.imageUrl,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(gte(posts.likesCount, 100))
      .orderBy(desc(posts.createdAt));
    } else {
      // 기본 쿼리 (새 게시판)
      postsData = await db.select({
        id: posts.id,
        title: posts.title,
        author: sql`COALESCE(${users.nickname}, ${users.username})`,
        authorId: posts.authorId,
        date: posts.createdAt,
        likes: posts.likesCount,
        category: posts.category,
        imageUrl: posts.imageUrl,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));
    }
    
    // 각 게시글의 댓글 수 가져오기
    const postsWithCommentsCount = await Promise.all(
      postsData.map(async (post) => {
        const { count } = await db.select({
          count: sql<number>`count(*)`,
        })
        .from(comments)
        .where(eq(comments.postId, post.id))
        .then(res => res[0]);
        
        return {
          ...post,
          commentsCount: count || 0,
        };
      })
    );
    
    // Clerk 인증 정보 확인
    const authData = await auth();
    const userId = authData.userId;
    
    if (userId) {
      // 사용자가 스크랩한 게시글 가져오기
      const scrapedPosts = await db.select({
        postId: postScraps.postId
      })
      .from(postScraps)
      .where(eq(postScraps.userId, userId));
      
      const scrapedPostIds = new Set(scrapedPosts.map(post => post.postId));
      
      // 사용자가 좋아요한 게시글 가져오기
      const likedPosts = await db.select({
        postId: postLikes.postId
      })
      .from(postLikes)
      .where(eq(postLikes.userId, userId));
      
      const likedPostIds = new Set(likedPosts.map(post => post.postId));
      
      // 스크랩 및 좋아요 정보 추가
      const postsWithUserInfo = postsWithCommentsCount.map(post => ({
        ...post,
        isScraped: scrapedPostIds.has(post.id),
        isLiked: likedPostIds.has(post.id)
      }));
      
      return NextResponse.json(postsWithUserInfo);
    }
    
    return NextResponse.json(postsWithCommentsCount);
    
  } catch (error) {
    console.error('게시글 목록 가져오기 오류:', error);
    return NextResponse.json({ error: '게시글 목록을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 