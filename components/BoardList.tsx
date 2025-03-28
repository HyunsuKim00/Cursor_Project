'use client'

import Link from 'next/link'
import { HeartIcon, MagnifyingGlassIcon, PencilSquareIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Pagination } from './Pagination'
import { posts } from '@/data/posts'

const POSTS_PER_PAGE = 5

interface BoardListProps {
  filter?: 'hot' | 'best'
}

type SortOption = 'date' | 'likes'

export function BoardList({ filter }: BoardListProps = {}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('date')

  // 게시글 필터링
  let filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // HOT 게시판 필터링 (좋아요 10개 이상)
  if (filter === 'hot') {
    filteredPosts = filteredPosts.filter(post => post.likes >= 10)
  }
  // BEST 게시판 필터링 (좋아요 100개 이상)
  else if (filter === 'best') {
    filteredPosts = filteredPosts.filter(post => post.likes >= 100)
  }

  // 게시글 정렬
  filteredPosts.sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    } else {
      return b.likes - a.likes
    }
  })

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption)
    setCurrentPage(1) // 정렬 변경 시 첫 페이지로 이동
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
                setSearchQuery(e.target.value)
                setCurrentPage(1) // 검색 시 첫 페이지로 이동
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
                    <span>{post.date}</span>
                    <div className="flex items-center space-x-1">
                      <HeartIcon className="h-4 w-4" />
                      <span>{post.likes}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                      <span>{post.comments.length}</span>
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