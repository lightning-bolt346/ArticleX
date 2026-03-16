import pdfMake from 'pdfmake/build/pdfmake'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { ArticleObject, ContentBlock } from '../../types/article'

const pdfFonts = await import('pdfmake/build/vfs_fonts')
;(pdfMake as unknown as { vfs: Record<string, string> }).vfs =
  (pdfFonts as unknown as { pdfMake?: { vfs: Record<string, string> }; default?: { pdfMake?: { vfs: Record<string, string> } } })
    .pdfMake?.vfs ??
  (pdfFonts as unknown as { default: { pdfMake: { vfs: Record<string, string> } } }).default?.pdfMake?.vfs ??
  {}

const cleanHandle = (handle: string): string => handle.replace(/^@/, '')

async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function annotatedText(block: ContentBlock): Content {
  if (block.annotations.length === 0) return block.text
  const parts: Content[] = []
  let lastIdx = 0
  for (const ann of block.annotations) {
    if (ann.offset > lastIdx) parts.push(block.text.slice(lastIdx, ann.offset))
    const slice = block.text.slice(ann.offset, ann.offset + ann.length)
    if (ann.type === 'bold') parts.push({ text: slice, bold: true })
    else if (ann.type === 'link' && ann.url) parts.push({ text: slice, color: '#0563C1', decoration: 'underline' as const, link: ann.url })
    else parts.push(slice)
    lastIdx = ann.offset + ann.length
  }
  if (lastIdx < block.text.length) parts.push(block.text.slice(lastIdx))
  return parts
}

const imageCache = new Map<string, string | null>()

async function getImageDataUrl(url: string): Promise<string | null> {
  if (imageCache.has(url)) return imageCache.get(url) ?? null
  const result = await fetchImageDataUrl(url)
  imageCache.set(url, result)
  return result
}

async function blocksToContent(blocks: ContentBlock[]): Promise<Content[]> {
  const content: Content[] = []
  let listItems: Content[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      content.push({ ul: listItems, margin: [0, 4, 0, 4] as [number, number, number, number] })
      listItems = []
    }
  }

  for (const block of blocks) {
    if (block.type !== 'list-item') flushList()

    switch (block.type) {
      case 'heading':
        content.push({
          text: block.text,
          style: block.level === 1 ? 'h1' : 'h2',
          margin: [0, 14, 0, 4] as [number, number, number, number],
        })
        break
      case 'list-item':
        listItems.push({ text: annotatedText(block), margin: [0, 1, 0, 1] as [number, number, number, number] })
        break
      case 'blockquote':
        content.push({
          text: block.text,
          italics: true,
          color: '#6b7280',
          margin: [16, 6, 0, 6] as [number, number, number, number],
        })
        break
      case 'code-block':
        content.push({
          text: block.text,
          font: 'Courier',
          fontSize: 8,
          background: '#f3f4f6',
          color: '#374151',
          margin: [0, 6, 0, 6] as [number, number, number, number],
          preserveLeadingSpaces: true,
        })
        break
      case 'image':
        if (block.imageUrl) {
          const dataUrl = await getImageDataUrl(block.imageUrl)
          if (dataUrl) {
            content.push({
              image: dataUrl,
              width: 420,
              alignment: 'center' as const,
              margin: [0, 8, 0, 8] as [number, number, number, number],
            })
          }
        }
        break
      default:
        content.push({ text: annotatedText(block), margin: [0, 0, 0, 8] as [number, number, number, number] })
        break
    }
  }

  flushList()
  return content
}

export const generatePDF = async (article: ArticleObject): Promise<void> => {
  imageCache.clear()
  const handle = cleanHandle(article.authorHandle)
  const publishedDate = new Date(article.publishedAt).toLocaleString()
  const hasRichContent = article.contentBlocks.length > 0

  const bodyContent: Content[] = hasRichContent
    ? await blocksToContent(article.contentBlocks)
    : article.body
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ text: line, margin: [0, 0, 0, 8] as [number, number, number, number] }))

  const trailingImageContent: Content[] = []
  if (!hasRichContent) {
    for (const url of article.images) {
      const dataUrl = await getImageDataUrl(url)
      if (dataUrl) {
        trailingImageContent.push({
          image: dataUrl,
          width: 420,
          alignment: 'center' as const,
          margin: [0, 8, 0, 8] as [number, number, number, number],
        })
      }
    }
  }

  let coverContent: Content[] = []
  if (article.coverImage) {
    const coverDataUrl = await getImageDataUrl(article.coverImage)
    if (coverDataUrl) {
      coverContent = [{
        image: coverDataUrl,
        width: 470,
        alignment: 'center' as const,
        margin: [0, 0, 0, 12] as [number, number, number, number],
      }]
    }
  }

  const branding = `ArticleX · Free & Open · ${new Date().toLocaleDateString()}`

  const docDefinition: TDocumentDefinitions = {
    content: [
      ...(article.title
        ? [{ text: article.title, style: 'title' } as Content]
        : []),
      {
        text: [
          { text: article.authorName, bold: true },
          { text: `  @${handle}`, color: '#06b6d4', fontSize: 9 },
          { text: `  ·  ${publishedDate}`, color: '#888888', fontSize: 9 },
        ],
        margin: [0, 0, 0, 3] as [number, number, number, number],
      },
      {
        text: [
          { text: 'Source: ', color: '#888888', fontSize: 8 },
          { text: article.url, link: article.url, color: '#0563C1', fontSize: 8, decoration: 'underline' as const },
        ],
        margin: [0, 0, 0, 16] as [number, number, number, number],
      },
      ...coverContent,
      ...bodyContent,
      ...trailingImageContent,
    ],
    footer: (currentPage: number) => {
      if (currentPage % 2 === 0) {
        return {
          text: branding,
          fontSize: 7,
          color: '#999999',
          italics: true,
          alignment: 'center' as const,
          margin: [0, 10, 0, 0] as [number, number, number, number],
        }
      }
      return {
        text: `Page ${currentPage}`,
        fontSize: 7,
        color: '#bbbbbb',
        alignment: 'center' as const,
        margin: [0, 10, 0, 0] as [number, number, number, number],
      }
    },
    styles: {
      title: { fontSize: 20, bold: true, color: '#7c3aed', margin: [0, 0, 0, 8] },
      h1: { fontSize: 16, bold: true, color: '#1f2937' },
      h2: { fontSize: 14, bold: true, color: '#1f2937' },
    },
    defaultStyle: { fontSize: 10, lineHeight: 1.5 },
    pageMargins: [50, 40, 50, 40],
  }

  pdfMake.createPdf(docDefinition).download(`${handle}-article.pdf`)
}
