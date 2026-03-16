export interface InlineAnnotation {
  offset: number
  length: number
  type: 'bold' | 'italic' | 'link'
  url?: string
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'list-item' | 'blockquote' | 'image'
  text: string
  imageUrl?: string
  annotations: InlineAnnotation[]
}

export interface ArticleObject {
  tweetId: string
  url: string
  authorName: string
  authorHandle: string
  authorAvatar: string
  publishedAt: string
  title: string | null
  body: string
  contentBlocks: ContentBlock[]
  coverImage?: string
  images: string[]
  wordCount: number
  readingTime: number
}
