import type { ArticleObject } from '../../types/article'

const cleanHandle = (handle: string): string => handle.replace(/^@/, '')

const triggerDownload = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/markdown' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

export const generateMarkdown = (article: ArticleObject): void => {
  const handle = cleanHandle(article.authorHandle)
  const title = article.title ?? `X Post by @${handle}`
  const date = new Date(article.publishedAt).toLocaleString()
  const today = new Date().toLocaleDateString()

  const body = article.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n\n')

  const imagesSection =
    article.images.length > 0
      ? `\n## Images\n\n${article.images
          .map((url, index) => `![Image ${index + 1}](${url})`)
          .join('\n')}\n`
      : ''

  const markdown = `---
title: ${title}
author: ${article.authorName} (@${handle})
date: ${date}
source: ${article.url}
words: ${article.wordCount}
---

# ${article.title ?? `@${handle} on X`}

> **${article.authorName}** · @${handle} · ${date}

---

${body}
${imagesSection}
---

*Exported from ArticleX on ${today} · [View original](${article.url})*
`

  triggerDownload(`${handle}-article.md`, markdown)
}
