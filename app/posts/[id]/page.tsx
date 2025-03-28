'use client'

import { posts } from '@/data/posts'
import { CommentSection } from '@/components/CommentSection'
import { useState } from 'react'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs'

export default function PostPage({ params }: { params: { id: string } }) {
  const postId = parseInt(params.id)
  const post = posts.find(p => p.id === postId)
  const [likes, setLikes] = useState(post?.likes || 0)
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1)
      setIsLiked(false)
    } else {
      setLikes(prev => prev + 1)
      setIsLiked(true)
    }
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          게시글을 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SignedIn>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <div className="flex items-center space-x-4">
                  <span>{post.author}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
                <button
                  onClick={handleLike}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  {isLiked ? (
                    <HeartSolidIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <HeartOutlineIcon className="h-5 w-5" />
                  )}
                  <span className={isLiked ? 'text-red-500' : ''}>{likes}</span>
                </button>
              </div>
              <div className="prose max-w-none">
                {post.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
          <CommentSection postId={post.id} />
        </div>
      </SignedIn>

      <SignedOut>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요한 서비스입니다</h2>
          <p className="text-gray-600 mb-8">게시글을 보시려면 로그인해주세요.</p>
          <div className="flex space-x-4">
            <SignInButton mode="modal">
              <button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                로그인
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-6 py-2 bg-white text-blue-500 border border-blue-500 rounded-md hover:bg-blue-50 transition-colors">
                회원가입
              </button>
            </SignUpButton>
          </div>
        </div>
      </SignedOut>
    </div>
  )
} 