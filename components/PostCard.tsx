import Link from 'next/link'
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'

interface PostCardProps {
  post: {
    id: number
    title: string
    content: string
    author: string
    date: string
    likes: number
    comments: any[]
  }
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h2>
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {post.content}
          </p>
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <span>{post.author}</span>
              <span>•</span>
              <span>{post.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                <span>{post.likes}</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                <span>{post.comments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
} 