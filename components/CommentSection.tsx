'use client'

import { useState, useEffect } from 'react'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { CommentSectionProps, Comment } from '@/types/interfaces'

export function CommentSection({ postId, comments: initialComments }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<Comment[]>(initialComments || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialComments) {
      setComments(initialComments);
    }
  }, [initialComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/posts/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content: newComment,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '댓글 작성에 실패했습니다.');
      }
      
      const commentData = await response.json();
      
      // 새 댓글 추가
      setComments(prevComments => [commentData, ...prevComments]);
      setNewComment('');
      
    } catch (err) {
      console.error('댓글 작성 오류:', err);
      setError(err instanceof Error ? err.message : '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleLike = async (commentId: number) => {
    try {
      const commentIndex = comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) return;
      
      const comment = comments[commentIndex];
      const action = comment.isLiked ? 'unlike' : 'like';
      
      // 낙관적 UI 업데이트
      const updatedComments = [...comments];
      updatedComments[commentIndex] = {
        ...comment,
        likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
        isLiked: !comment.isLiked,
      };
      setComments(updatedComments);
      
      // API 요청 - 댓글 좋아요 API 사용
      const response = await fetch('/api/comments/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          action,
        }),
      });
      
      if (!response.ok) {
        // 실패 시 원래 상태로 복구
        setComments(comments);
        const errorData = await response.json();
        throw new Error(errorData.error || '좋아요 처리에 실패했습니다.');
      }
      
    } catch (err) {
      console.error('댓글 좋아요 처리 오류:', err);
      alert('댓글 좋아요 처리 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">댓글</h2>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? '댓글 작성 중...' : '댓글 작성'}
        </button>
      </form>

      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-900">{comment.content}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>{comment.author}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(comment.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  {comment.isLiked ? (
                    <HeartSolidIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <HeartOutlineIcon className="h-5 w-5" />
                  )}
                  <span className={comment.isLiked ? 'text-red-500' : ''}>
                    {comment.likes}
                  </span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            첫 번째 댓글을 작성해보세요!
          </div>
        )}
      </div>
    </div>
  )
} 