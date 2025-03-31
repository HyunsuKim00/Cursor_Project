import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { posts, users } from '@/db/schema'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 데이터베이스에서 현재 사용자가 작성한 게시물 조회
    const myPosts = await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      author: sql`COALESCE(${users.nickname}, ${users.username})`,
      authorId: posts.authorId,
      date: posts.createdAt,
      likes: posts.likesCount,
      imageUrl: posts.imageUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.authorId, userId));

    return NextResponse.json(myPosts);
  } catch (error) {
    console.error('내 게시물 조회 오류:', error);
    return NextResponse.json({ error: '게시물을 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 