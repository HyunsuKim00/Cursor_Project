'use client'

import { useState, useEffect } from 'react'
import { PostForm } from '@/components/PostForm'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Post, PromisePageParams } from '@/types/interfaces'

export default function EditPost({ params }: { params: PromisePageParams }) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [postId, setPostId] = useState<number | null>(null)

  useEffect(() => {
    const fetchParams = async () => {
      try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        setPostId(id);
      } catch (err) {
        console.error('params 로딩 오류:', err);
        setError('게시글 ID를 불러오는데 실패했습니다.');
      }
    };

    fetchParams();
  }, [params]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      
      try {
        setIsLoading(true)
        
        const response = await fetch(`/api/posts/${postId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('게시글을 찾을 수 없습니다.')
          }
          throw new Error('게시글을 불러오는데 실패했습니다.')
        }
        
        const data = await response.json()
        setPost(data)
        
        // 현재 사용자가 게시물 작성자인지 확인
        if (isLoaded && user && user.id !== data.authorId) {
          toast.error('본인이 작성한 게시글만 수정할 수 있습니다.')
          router.push(`/posts/${postId}`)
        }
        
      } catch (err) {
        console.error('게시글 로딩 오류:', err)
        setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (isLoaded) {
      fetchPost()
    }
  }, [postId, user, isLoaded, router])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">게시글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {error || '게시글을 찾을 수 없습니다.'}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link
            href={`/posts/${postId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            <span>게시글로 돌아가기</span>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">게시글 수정</h1>
        <div className="bg-white shadow-sm rounded-lg p-6">
          <PostForm initialData={post} isEditing={true} />
        </div>
      </div>
    </main>
  )
} 