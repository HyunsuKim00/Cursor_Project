export interface Comment {
  id: number
  content: string
  author: string
  authorId?: string
  postId?: number
  date: string
  likes: number
  isLiked?: boolean
}

export interface Post {
  id: number
  title: string
  content: string
  author: string
  authorId?: string
  date?: string
  createdAt?: string
  likes: number
  imageUrl?: string
  comments: Comment[]
  category?: string
  isScraped?: boolean
  isLiked?: boolean
  commentsCount?: number
}

export interface User {
  id: string
  username?: string
  nickname?: string
  email?: string
  fullName?: string
}

export interface PageParams {
  id: string
}

// Next.js 15용 Promise 타입 추가
export interface PromisePageParams extends Promise<PageParams> {}

export interface CommentSectionProps {
  postId: number
  comments?: Comment[]
  onAddComment?: (content: string) => void
}

export interface PostDetailProps {
  post: Post
}

export interface PostCardProps {
  post: Post
  isMyPost?: boolean
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export interface BoardListProps {
  filter?: 'hot' | 'best'
} 