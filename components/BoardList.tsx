'use client'

import Link from 'next/link'
import { MagnifyingGlassIcon, PencilSquareIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import { Pagination } from './Pagination'
import { BoardListProps } from '@/types/interfaces'

const POSTS_PER_PAGE = 5

type SortOption = 'date' | 'likes'

interface PostData {
  id: number;
  title: string;
  author: string;
  authorId: string;
  date: string;
  likes: number;
  category: string;
  commentsCount: number;
  isScraped?: boolean;
  isLiked?: boolean;
}

export function BoardList({ filter }: BoardListProps = {}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [scrapedPosts, setScrapedPosts] = useState<Set<number>>(new Set())
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [posts, setPosts] = useState<PostData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        
        const queryParams = new URLSearchParams();
        if (filter) {
          queryParams.append('filter', filter);
        }
        
        const response = await fetch(`/api/posts?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setPosts(data);
        
        // 스크랩된 게시글 설정
        const scraped = new Set<number>();
        const liked = new Set<number>();
        
        data.forEach((post: PostData) => {
          if (post.isScraped) {
            scraped.add(post.id);
          }
          if (post.isLiked) {
            liked.add(post.id);
          }
        });
        
        setScrapedPosts(scraped);
        setLikedPosts(liked);
        
      } catch (err) {
        console.error('게시글 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPosts();
  }, [filter]);

  const handleScrap = async (e: React.MouseEvent, postId: number) => {
    e.preventDefault(); // 링크 이동 방지
    
    try {
      const isCurrentlyScraped = scrapedPosts.has(postId);
      const action = isCurrentlyScraped ? 'unscrap' : 'scrap';
      
      const response = await fetch('/api/posts/scrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, action }),
      });
      
      if (!response.ok) {
        throw new Error('스크랩 처리에 실패했습니다.');
      }
      
      setScrapedPosts(prev => {
        const newScraped = new Set(prev);
        if (newScraped.has(postId)) {
          newScraped.delete(postId);
        } else {
          newScraped.add(postId);
        }
        return newScraped;
      });
      
    } catch (err) {
      console.error('스크랩 처리 오류:', err);
      alert('스크랩 처리 중 오류가 발생했습니다.');
    }
  };
  
  const handleLike = async (e: React.MouseEvent, postId: number) => {
    e.preventDefault(); // 링크 이동 방지
    
    try {
      const isCurrentlyLiked = likedPosts.has(postId);
      const action = isCurrentlyLiked ? 'unlike' : 'like';
      
      const response = await fetch('/api/posts/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, action }),
      });
      
      if (!response.ok) {
        throw new Error('좋아요 처리에 실패했습니다.');
      }
      
      // 좋아요 상태 업데이트
      setLikedPosts(prev => {
        const newLiked = new Set(prev);
        if (newLiked.has(postId)) {
          newLiked.delete(postId);
        } else {
          newLiked.add(postId);
        }
        return newLiked;
      });
      
      // 게시글 목록에서 좋아요 수 업데이트
      setPosts(prev => 
        prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1
            };
          }
          return post;
        })
      );
      
    } catch (err) {
      console.error('좋아요 처리 오류:', err);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 게시글 필터링 (검색)
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 게시글 정렬
  filteredPosts.sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return b.likes - a.likes;
    }
  });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden p-8 text-center">
        <p className="text-gray-500">게시글을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden p-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">게시글 목록</h2>
          <Link
            href="/posts/new"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <PencilSquareIcon className="h-4 w-4 mr-2" />
            글쓰기
          </Link>
        </div>
      </div>
      
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="제목 또는 작성자로 검색"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // 검색 시 첫 페이지로 이동
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="block w-40 px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="date">최신순</option>
            <option value="likes">인기순</option>
          </select>
        </div>
      </div>

      <div>
        {paginatedPosts.length > 0 ? (
          paginatedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block hover:bg-gray-50 transition-colors"
            >
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-gray-900">{post.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => handleLike(e, post.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                        title="좋아요"
                      >
                        {likedPosts.has(post.id) ? (
                          <HeartSolid className="h-4 w-4 text-red-500" />
                        ) : (
                          <HeartOutline className="h-4 w-4" />
                        )}
                        <span>{post.likes}</span>
                      </button>
                      <button
                        onClick={(e) => handleScrap(e, post.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-yellow-500 transition-colors"
                        title="스크랩"
                      >
                        {scrapedPosts.has(post.id) ? (
                          <StarSolid className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <StarOutline className="h-4 w-4" />
                        )}
                      </button>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>{post.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            {searchQuery ? '검색 결과가 없습니다.' : '게시물이 없습니다.'}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
} 