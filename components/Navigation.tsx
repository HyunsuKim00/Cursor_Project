'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <nav className="bg-blue-500 shadow-lg rounded-lg overflow-hidden">
      <div className="px-4">
        <div className="flex space-x-4">
          <Link 
            href="/" 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              isActive('/')
                ? 'border-white text-white'
                : 'border-transparent text-blue-50 hover:text-white hover:border-blue-100'
            }`}
          >
            새 게시판
          </Link>
          <Link 
            href="/hot" 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              isActive('/hot')
                ? 'border-white text-white'
                : 'border-transparent text-blue-50 hover:text-white hover:border-blue-100'
            }`}
          >
            HOT 게시판
          </Link>
          <Link 
            href="/best" 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              isActive('/best')
                ? 'border-white text-white'
                : 'border-transparent text-blue-50 hover:text-white hover:border-blue-100'
            }`}
          >
            BEST 게시판
          </Link>
        </div>
      </div>
    </nav>
  )
} 