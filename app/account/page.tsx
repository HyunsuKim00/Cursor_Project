'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Post } from '@/types/post'

export default function AccountPage() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isSignedIn && userId) {
      // 사용자가 작성한 게시물 가져오기
      const fetchMyPosts = async () => {
        try {
          setIsLoading(true)
          const response = await fetch('/api/posts/my-posts')
          if (!response.ok) {
            throw new Error('Failed to fetch posts')
          }
          const data = await response.json()
          setMyPosts(data)
        } catch (error) {
          console.error('Error fetching my posts:', error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchMyPosts()
    }
  }, [isSignedIn, userId])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">내가 작성한 게시물</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">게시물을 불러오는 중...</p>
            </div>
          ) : myPosts.length === 0 ? (
            <p className="text-gray-500">작성한 게시물이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {myPosts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/posts/${post.id}`)}
                >
                  <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>좋아요 {post.likes}개</span>
                    <span className="mx-2">•</span>
                    <span>댓글 {post.comments.length}개</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 