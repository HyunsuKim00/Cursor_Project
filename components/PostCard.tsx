import Link from 'next/link'
import { HeartIcon as HeartOutline, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { useState } from 'react'
import { PostCardProps } from '@/types/interfaces'
import { useUser } from '@clerk/nextjs'

export default function PostCard({ post, isMyPost = false }: PostCardProps & { isMyPost?: boolean }) {
  const [isScraped, setIsScraped] = useState(post.isScraped || false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const { user } = useUser();
  
  const handleScrap = async (e: React.MouseEvent) => {
    e.preventDefault(); // 링크 이동 방지
    
    try {
      const action = isScraped ? 'unscrap' : 'scrap';
      
      const response = await fetch('/api/posts/scrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          action,
        }),
      });
      
      if (!response.ok) {
        throw new Error('스크랩 처리에 실패했습니다.');
      }
      
      setIsScraped(prev => !prev);
    } catch (error) {
      console.error('스크랩 오류:', error);
      alert('스크랩 처리 중 오류가 발생했습니다.');
    }
  };
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // 링크 이동 방지
    
    try {
      const action = isLiked ? 'unlike' : 'like';
      
      const response = await fetch('/api/posts/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          action,
        }),
      });
      
      if (!response.ok) {
        throw new Error('좋아요 처리에 실패했습니다.');
      }
      
      setIsLiked(prev => !prev);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('좋아요 오류:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };
  
  // comments가 없는 경우 기본값으로 빈 배열 제공
  const commentsLength = post.comments?.length || post.commentsCount || 0;
  
  return (
    <Link href={`/posts/${post.id}`}>
      <div className="bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-300">
        <div className="p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {post.title}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleLike}
                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                title="좋아요"
              >
                {isLiked ? (
                  <HeartSolid className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartOutline className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleScrap}
                className="p-1 text-gray-500 hover:text-yellow-500 transition-colors"
                title="스크랩"
              >
                {isScraped ? (
                  <StarSolid className="h-5 w-5 text-yellow-500" />
                ) : (
                  <StarOutline className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {post.content}
          </p>
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <span>{post.author}</span>
              <span>•</span>
              <span>{typeof post.date === 'string' ? new Date(post.date).toLocaleDateString() : typeof post.createdAt === 'string' ? new Date(post.createdAt).toLocaleDateString() : '날짜 정보 없음'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <HeartOutline className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                <span>{likesCount}</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                <span>{commentsLength}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
} 