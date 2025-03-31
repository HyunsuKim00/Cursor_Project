'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Post, User } from '@/types/interfaces'
import PostCard from '@/components/PostCard'
import {
  PencilSquareIcon
} from '@heroicons/react/24/outline'

export default function AccountPage() {
  const { user, isLoaded } = useUser()
  // useUser() : 현재 로그인한 사용자의 정보를 가져오는 React 훅
  // isLoaded : 사용자 정보가 로드되었는지 여부를 나타내는 상태
  // user : 사용자 정보 객체

  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [scrapedPosts, setScrapedPosts] = useState<Post[]>([])
  const [nickname, setNickname] = useState('')
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      // 닉네임 초기값 설정
      // 로컬 스토리지에 저장된 닉네임이 있으면 그 값을 사용, 없으면 사용자 이름 또는 이메일을 사용
      // 왜 로컬 스토리지에도 저장해야 하는지 이해가 안감
      // db나 clerk에 저장된 닉네임을 가져오면 되지 않나?
      const savedNickname = localStorage.getItem(`nickname_${user.id}`)
      if (savedNickname) {
        setNickname(savedNickname)
      } else {
        setNickname(user?.username || user?.firstName || '사용자')
      }

      // 사용자 데이터 설정
      setUserData({
        id: user.id,
        username: user.username || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        fullName: user.fullName || '',
        nickname: savedNickname || user?.username || user?.firstName || '사용자'
      })

      // 사용자 작성 게시물 가져오기
      const fetchUserPosts = async () => {
        try {
          const response = await fetch('/api/posts/my-posts');
          if (response.ok) {
            const data = await response.json();
            setMyPosts(data);
          }
        } catch (error) {
          console.error('내 게시물 로딩 오류:', error);
        }
      };

      // 스크랩한 게시물 가져오기
      const fetchScrapedPosts = async () => {
        try {
          const response = await fetch('/api/posts/my-scraps');
          if (response.ok) {
            const data = await response.json();
            setScrapedPosts(data);
          }
        } catch (error) {
          console.error('스크랩 게시물 로딩 오류:', error);
        }
      };

      // API 호출 실행
      fetchUserPosts();
      fetchScrapedPosts();
    }
  }, [isLoaded, user])

  // 닉네임 업데이트 함수
  const updateNickname = async () => {
    if (!user || !nickname.trim()) return;
    
    setIsSubmitting(true);
    try {
      // 서버 API 호출하여 닉네임 업데이트
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '닉네임 업데이트 실패');
      }
      
      // 로컬 스토리지에도 저장
      localStorage.setItem(`nickname_${user.id}`, nickname);
      
      // 사용자 데이터 업데이트
      if (userData) {
        setUserData({
          ...userData,
          nickname
        });
      }
      
      setIsEditingNickname(false);
      alert('닉네임이 성공적으로 변경되었습니다.');
      
      // 페이지 새로고침하여 업데이트된 닉네임으로 게시물 목록 표시
      window.location.reload();
    } catch (error) {
      console.error('닉네임 업데이트 실패:', error);
      alert('닉네임 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">내 계정</h1>
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <div className="text-lg text-gray-700 mr-2">
              {isEditingNickname ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="닉네임 입력"
                    maxLength={20}
                  />
                  <button
                    onClick={updateNickname}
                    disabled={isSubmitting}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setIsEditingNickname(false)}
                    className="ml-2 text-gray-500 px-3 py-1 rounded-md text-sm hover:bg-gray-100 transition-colors"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <p>
                  <span>{nickname}님, 안녕하세요!</span>
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                  >
                    닉네임 변경
                  </button>
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {user?.primaryEmailAddress?.emailAddress || '이메일 정보 없음'}
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">내 게시물</h2>
          <Link 
            href="/posts/new"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <PencilSquareIcon className="h-4 w-4 mr-2" />
            작성하기
          </Link>
        </div>
        
        {myPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {myPosts.map(post => (
              <PostCard key={post.id} post={post} isMyPost={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            작성한 게시물이 없습니다.
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">저장된 게시물</h2>
        </div>
        
        {scrapedPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {scrapedPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            저장된 게시물이 없습니다.
          </div>
        )}
      </div>
    </div>
  )
} 