import { BoardList } from '@/components/BoardList'
import { Navigation } from '@/components/Navigation'

export default function BestBoard() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">BEST 게시판</h1>
        <Navigation />
        <div className="mt-8">
          <BoardList filter="best" />
        </div>
      </div>
    </main>
  )
} 