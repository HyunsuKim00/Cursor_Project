'use client'

import { useState } from 'react'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { posts } from '@/data/posts'

interface CommentSectionProps {
  postId: number
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const post = posts.find(p => p.id === postId)
  const [comments, setComments] = useState(post?.comments || [])
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set())
  const [commentLikes, setCommentLikes] = useState<Record<number, number>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const comment = {
      id: comments.length + 1,
      postId,
      content: newComment,
      author: '현재 사용자',
      date: new Date().toISOString().split('T')[0],
      likes: 0
    }

    setComments([...comments, comment])
    setNewComment('')
  }

  const handleLike = (commentId: number) => {
    if (likedComments.has(commentId)) {
      setLikedComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) - 1
      }))
    } else {
      setLikedComments(prev => new Set([...prev, commentId]))
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) + 1
      }))
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">댓글</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          댓글 작성
        </button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-900">{comment.content}</p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span>{comment.author}</span>
                  <span className="mx-2">•</span>
                  <span>{comment.date}</span>
                </div>
              </div>
              <button
                onClick={() => handleLike(comment.id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                {likedComments.has(comment.id) ? (
                  <HeartSolidIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartOutlineIcon className="h-5 w-5" />
                )}
                <span className={likedComments.has(comment.id) ? 'text-red-500' : ''}>
                  {comment.likes + (commentLikes[comment.id] || 0)}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 