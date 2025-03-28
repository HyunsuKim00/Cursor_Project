export interface Comment {
  id: string
  content: string
  authorId: string
  createdAt: string
  likes: number
}

export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  createdAt: string
  likes: number
  comments: Comment[]
  category: string
} 