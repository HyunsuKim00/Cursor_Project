'use client'

import { useState, useEffect, use } from 'react'
import { CommentSection } from '@/components/CommentSection'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import { PageParams, Comment } from '@/types/interfaces'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface PostData {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  likes: number;
  imageUrl?: string;
  isLiked?: boolean;
  isScraped?: boolean;
  comments: Comment[];
}

export default function PostPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const { user } = useUser();
  const unwrappedParams = use(params);
  const postId = parseInt(unwrappedParams.id);
  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScraped, setIsScraped] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // 현재 사용자가 게시물 작성자인지 확인
  const isOwner = user?.id === post?.authorId;

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/posts/${postId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('게시글을 찾을 수 없습니다.');
          }
          throw new Error('게시글을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setPost(data);
        setComments(data.comments || []);
        setIsScraped(data.isScraped || false);
        setIsLiked(data.isLiked || false);
        setLikesCount(data.likes || 0);
        
      } catch (err) {
        console.error('게시글 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPostData();
  }, [postId]);

  const handleLike = async () => {
    // 포스트가 없으면 실행하지 않음.
    if (!post) return;
    
    try {
      // 현재 좋아요 상태에 따라 'like' 또는 'unlike' 설정
      const action = isLiked ? 'unlike' : 'like';
      // 좋아요 수 업데이트
      const newLikesCount = isLiked ? likesCount - 1 : likesCount + 1;
      
      setIsLiked(!isLiked);
      setLikesCount(newLikesCount);
      
      // API가 어떤 데이터를 받을지 정의의
      const response = await fetch('/api/posts/like', {
        method: 'POST',
        // 클라이언트가 보낸 데이터가 JSON 객체로 되어 있음을 서버에 알려주는 것
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          action,
        }),
      });
      
      // fetch 요청의 응답이 성공적이지 않은 경우
      if (!response.ok) {
        // isLiked 상태와 좋아요 수를 원래대로 복구
        setIsLiked(isLiked);
        setLikesCount(likesCount);
        throw new Error('좋아요 처리에 실패했습니다.');
      }
      
    } catch (err) {
      console.error('좋아요 처리 오류:', err);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  }

  const handleScrap = async () => {
    if (!post) return;
    
    try {
      const action = isScraped ? 'unscrap' : 'scrap';
      
      setIsScraped(!isScraped);
      
      const response = await fetch('/api/posts/scrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          action,
        }),
      });
      
      if (!response.ok) {
        setIsScraped(isScraped);
        throw new Error('스크랩 처리에 실패했습니다.');
      }
      
    } catch (err) {
      console.error('스크랩 처리 오류:', err);
      toast.error('스크랩 처리 중 오류가 발생했습니다.');
    }
  }

  // 게시물 삭제 처리
  const handleDelete = async () => {
    if (!post || !isOwner || isDeleting) return;
    
    if (window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
      setIsDeleting(true);
      
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('게시물 삭제에 실패했습니다.');
        }
        
        toast.success('게시물이 삭제되었습니다.');
        router.push('/');
      } catch (err) {
        console.error('게시물 삭제 오류:', err);
        toast.error('게시물 삭제 중 오류가 발생했습니다.');
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {error || '게시글을 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto mb-4">
        <SignedIn>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex items-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mr-3">{post.title}</h1>
                  
                  {isOwner && (
                    <div className="flex space-x-1">
                      <Link
                        href={`/posts/${post.id}/edit`}
                        className="inline-flex items-center p-1 text-gray-500 hover:text-blue-500 transition-colors"
                        title="수정하기"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={handleDelete}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                        title="삭제하기"
                        disabled={isDeleting}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <div className="flex items-center space-x-4">
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
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
                      <span className={isLiked ? 'text-red-500' : ''}>{likesCount}</span>
                    </button>
                  </div>
                </div>

                {post.imageUrl && (
                  <div className="mb-6">
                    <img
                      src={post.imageUrl}
                      alt="게시글 이미지"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}

                <div className="prose max-w-none">
                  {post.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
            <CommentSection postId={post.id} comments={post.comments} />
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
    </div>
  )
} 