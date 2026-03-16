import type { ArticleObject } from '../../types/article'

export const generateMarkdownDocument = (article: ArticleObject): string => {
  const title = article.title ?? `Post by @${article.authorHandle}`
  const header = [
    `# ${title}`,
    '',
    `- Author: @${article.authorHandle}`,
    `- Source: ${article.url}`,
    `- Published: ${new Date(article.publishedAt).toISOString()}`,
    '',
    '---',
    '',
  ]

  return `${header.join('\n')}${article.body}\n`
}
