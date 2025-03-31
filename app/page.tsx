'use client'

import { BoardList } from '@/components/BoardList'
import { Navigation } from '@/components/Navigation'
import { SignInButton, SignUpButton, SignedIn, SignedOut, useAuth, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
  }

  if (!isLoaded) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <SignedIn>
          <Navigation />
          <div className="mt-8">
            <BoardList />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요한 서비스입니다</h2>
            <p className="text-gray-600 mb-8">게시판을 이용하시려면 로그인해주세요.</p>
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
    </main>
  )
}
