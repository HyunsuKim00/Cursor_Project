import { PostForm } from '@/components/PostForm'

export default function NewPost() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">게시글 작성</h1>
        <div className="bg-white shadow-sm rounded-lg p-6">
          <PostForm />
        </div>
      </div>
    </main>
  )
} 