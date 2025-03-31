'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

/**
 * 사용자 정보를 Supabase와 동기화하는 컴포넌트
 * 사용자가 로그인하면 자동으로 DB에 사용자 정보를 추가/업데이트합니다.
 */
export default function UserSyncProvider() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    // 사용자가 로드되고 로그인되었을 때만 실행
    if (isLoaded && isSignedIn && user) {
      syncUserToDB();
    }
  }, [isLoaded, isSignedIn, user]);

  const syncUserToDB = async () => {
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          firstName: user?.firstName,
          lastName: user?.lastName,
          username: user?.username,
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      });

      if (!response.ok) {
        console.error('사용자 동기화 실패:', await response.text());
      } else {
        console.log('사용자 정보가 DB와 동기화되었습니다.');
      }
    } catch (error) {
      console.error('사용자 동기화 중 오류 발생:', error);
    }
  };

  // 이 컴포넌트는 UI를 렌더링하지 않고 백그라운드에서만 작동합니다.
  return null;
} 