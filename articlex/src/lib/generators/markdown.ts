import type { ArticleObject, ContentBlock, InlineAnnotation } from '../../types/article'

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

function renderAnnotatedMd(text: string, annotations: InlineAnnotation[]): string {
  if (annotations.length === 0) return text

  const sorted = [...annotations].sort((a, b) => a.offset - b.offset)
  let result = ''
  let lastIndex = 0

  for (const ann of sorted) {
    if (ann.offset > lastIndex) {
      result += text.slice(lastIndex, ann.offset)
    }

    const slice = text.slice(ann.offset, ann.offset + ann.length)

    if (ann.type === 'bold') {
      result += `**${slice}**`
    } else if (ann.type === 'link' && ann.url) {
      result += `[${slice}](${ann.url})`
    } else {
      result += slice
    }

    lastIndex = ann.offset + ann.length
  }

  if (lastIndex < text.length) {
    result += text.slice(lastIndex)
  }

  return result
}

function renderBlocksMd(blocks: ContentBlock[]): string {
  const parts: string[] = []

  for (const block of blocks) {
    const annotated = renderAnnotatedMd(block.text, block.annotations)

    switch (block.type) {
      case 'heading':
        parts.push(`## ${annotated}`)
        break
      case 'list-item':
        parts.push(`- ${annotated}`)
        break
      case 'blockquote':
        parts.push(`> ${annotated}`)
        break
      case 'code-block':
        parts.push('```\n' + block.text + '\n```')
        break
      case 'image':
        if (block.imageUrl) {
          parts.push(`![Article media](${block.imageUrl})`)
        }
        break
      default:
        parts.push(annotated)
        break
    }
  }

  return parts.join('\n\n')
}

export const generateMarkdown = (article: ArticleObject): void => {
  const handle = cleanHandle(article.authorHandle)
  const title = article.title ?? `X Post by @${handle}`
  const date = new Date(article.publishedAt).toLocaleString()
  const today = new Date().toLocaleDateString()

  const hasRichContent = article.contentBlocks.length > 0

  const body = hasRichContent
    ? renderBlocksMd(article.contentBlocks)
    : article.body
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join('\n\n')

  const trailingImages = hasRichContent ? [] : article.images
  const imagesSection =
    trailingImages.length > 0
      ? `\n## Images\n\n${trailingImages
          .map((url, index) => `![Image ${index + 1}](${url})`)
          .join('\n')}\n`
      : ''

  const coverSection = article.coverImage
    ? `![Cover](${article.coverImage})\n\n`
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

${coverSection}${body}
${imagesSection}
---

*Exported from ArticleX on ${today} · [View original](${article.url})*
`

  triggerDownload(`${handle}-article.md`, markdown)
}
