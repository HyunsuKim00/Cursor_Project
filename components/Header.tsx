'use client';

import Link from 'next/link';
import { useUser, useClerk } from '@clerk/nextjs';

export default function Header() {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  
  const handleSignOut = () => {
    signOut().then(() => {
      window.location.href = '/';
    });
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link 
          href="/"
          className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          학교 게시판
        </Link>
        
        <div className="flex items-center">
          <Link 
            href="https://hisnet.handong.edu/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            학교 홈페이지
          </Link>
          
          {isLoaded && isSignedIn ? (
            <>
              <span className="mx-2 text-gray-300">|</span>
              <Link 
                href="/account" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                My Account
              </Link>
              <span className="mx-2 text-gray-300">|</span>
              <button 
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <span className="mx-2 text-gray-300">|</span>
              <Link 
                href="/sign-in" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                로그인
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 