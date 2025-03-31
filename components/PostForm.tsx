'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Post } from '@/types/interfaces'

interface PostFormProps {
  initialData?: Post;
  isEditing?: boolean;
}

export function PostForm({ initialData, isEditing = false }: PostFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      
      // 수정 모드인 경우 게시물 ID 추가
      if (isEditing && initialData?.id) {
        formData.append('postId', initialData.id.toString());
      }
      
      // 수정 또는 생성 API 엔드포인트 선택
      const endpoint = isEditing ? `/api/posts/${initialData?.id}/update` : '/api/upload';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (isEditing ? '게시글 수정에 실패했습니다.' : '게시글 작성에 실패했습니다.'));
      }
      
      const data = await response.json();
      
      // 게시글 상세 페이지로 이동
      const postId = isEditing ? initialData?.id : data.post.id;
      router.push(`/posts/${postId}`);
      
    } catch (err) {
      console.error(isEditing ? '게시글 수정 오류:' : '게시글 작성 오류:', err);
      setError(err instanceof Error ? err.message : (isEditing ? '게시글 수정 중 오류가 발생했습니다.' : '게시글 작성 중 오류가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 ml-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          제목
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 pl-4"
          placeholder="게시글 제목을 입력하세요"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-4 pt-4"
          placeholder="게시글 내용을 입력하세요"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          취소
        </button>
        <button
          type="submit"
          className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEditing ? '수정 중...' : '작성 중...') : (isEditing ? '수정하기' : '작성하기')}
        </button>
      </div>
    </form>
  )
} 