import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { posts } from '@/data/posts'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 사용자가 작성한 게시물만 필터링
  const myPosts = posts.filter(post => post.author === userId)

  return NextResponse.json(myPosts)
} 