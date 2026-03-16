export interface ArticleObject {
  tweetId: string
  url: string
  authorName: string
  authorHandle: string
  authorAvatar: string
  publishedAt: string
  title: string | null
  body: string
  images: string[]
  wordCount: number
  readingTime: number
}
