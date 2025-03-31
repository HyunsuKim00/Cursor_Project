'use client'

import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import { CommentSection } from './CommentSection'
import { PostDetailProps } from '@/types/interfaces'
import Image from 'next/image'

export function PostDetail({ post }: PostDetailProps) {
  const [likes, setLikes] = useState(post.likes)
  const [isLiked, setIsLiked] = useState(false)
  const [isScraped, setIsScraped] = useState(post.isScraped || false)
  const [comments, setComments] = useState(post.comments)

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1)
      setIsLiked(false)
    } else {
      setLikes(prev => prev + 1)
      setIsLiked(true)
    }
  }

  const handleScrap = () => {
    setIsScraped(prev => !prev)
    // TODO: API 호출로 서버에 스크랩 정보 저장
  }

  const handleAddComment = (content: string) => {
    const newComment = {
      id: comments.length + 1,
      postId: post.id,
      content,
      author: '익명', // TODO: 실제 사용자 정보로 대체
      date: new Date().toISOString().split('T')[0],
      likes: 0,
    }
    setComments(prev => [...prev, newComment])
  }

  return (
    <article className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{post.author}</span>
            <span>•</span>
            <span>{post.date}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleScrap}
              className="flex items-center space-x-1 text-gray-500 hover:text-yellow-500 transition-colors"
              title="스크랩"
            >
              {isScraped ? (
                <StarSolidIcon className="h-5 w-5 text-yellow-500" />
              ) : (
                <StarOutlineIcon className="h-5 w-5" />
              )}
            </button>
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
        </div>
      </div>

      <div className="px-6 py-4">
        {post.imageUrl && (
          <div className="mb-6">
            <Image
              src={post.imageUrl}
              alt={post.title}
              width={800}
              height={450}
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        )}
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <CommentSection
          postId={post.id}
          comments={comments}
          onAddComment={handleAddComment}
        />
      </div>
    </article>
  )
} 