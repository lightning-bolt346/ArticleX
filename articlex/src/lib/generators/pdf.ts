import pdfMake from 'pdfmake/build/pdfmake'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { ArticleObject, ContentBlock } from '../../types/article'

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

function blocksToContent(blocks: ContentBlock[]): Content[] {
  const content: Content[] = []
  let listItems: Content[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      content.push({ ul: listItems, margin: [0, 6, 0, 6] as [number, number, number, number] })
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
          margin: [0, 16, 0, 6] as [number, number, number, number],
        })
        break

      case 'list-item': {
        const parts: Content[] = []
        if (block.annotations.length > 0) {
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
          listItems.push({ text: parts, margin: [0, 2, 0, 2] as [number, number, number, number] })
        } else {
          listItems.push({ text: block.text, margin: [0, 2, 0, 2] as [number, number, number, number] })
        }
        break
      }

      case 'blockquote':
        content.push({
          stack: [
            {
              canvas: [{ type: 'rect' as const, x: 0, y: 0, w: 3, h: 40, color: '#7c3aed' }],
            },
          ],
        })
        content.push({
          text: block.text,
          italics: true,
          color: '#6b7280',
          margin: [16, -38, 0, 8] as [number, number, number, number],
        })
        break

      case 'code-block':
        content.push({
          text: block.text,
          style: 'code',
          margin: [0, 8, 0, 8] as [number, number, number, number],
        })
        break

      case 'image':
        break

      default: {
        if (block.annotations.length > 0) {
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
          content.push({ text: parts, margin: [0, 0, 0, 10] as [number, number, number, number] })
        } else {
          content.push({ text: block.text, margin: [0, 0, 0, 10] as [number, number, number, number] })
        }
        break
      }
    }
  }

  flushList()
  return content
}

export const generatePDF = async (article: ArticleObject): Promise<void> => {
  const handle = cleanHandle(article.authorHandle)
  const publishedDate = new Date(article.publishedAt).toLocaleString()
  const hasRichContent = article.contentBlocks.length > 0

  const bodyContent: Content[] = hasRichContent
    ? blocksToContent(article.contentBlocks)
    : article.body
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ text: line, margin: [0, 0, 0, 10] as [number, number, number, number] }))

  const imageContent: Content[] = []
  const allImages = hasRichContent
    ? article.contentBlocks.filter((b) => b.type === 'image' && b.imageUrl).map((b) => b.imageUrl!)
    : article.images

  for (const url of allImages) {
    const dataUrl = await fetchImageDataUrl(url)
    if (dataUrl) {
      imageContent.push({
        image: dataUrl,
        width: 450,
        alignment: 'center' as const,
        margin: [0, 10, 0, 10] as [number, number, number, number],
      })
    }
  }

  let coverContent: Content[] = []
  if (article.coverImage) {
    const coverDataUrl = await fetchImageDataUrl(article.coverImage)
    if (coverDataUrl) {
      coverContent = [{
        image: coverDataUrl,
        width: 500,
        alignment: 'center' as const,
        margin: [0, 0, 0, 16] as [number, number, number, number],
      }]
    }
  }

  const docDefinition: TDocumentDefinitions = {
    content: [
      ...(article.title
        ? [{ text: article.title, style: 'title' } as Content]
        : []),
      {
        text: [
          { text: article.authorName, bold: true },
          { text: `  @${handle}`, color: '#06b6d4', fontSize: 10 },
          { text: `  ·  ${publishedDate}`, color: '#888888', fontSize: 10 },
        ],
        margin: [0, 0, 0, 4] as [number, number, number, number],
      },
      {
        text: [
          { text: 'Source: ', color: '#888888', fontSize: 8 },
          { text: article.url, link: article.url, color: '#0563C1', fontSize: 8, decoration: 'underline' as const },
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      ...coverContent,
      ...bodyContent,
      ...imageContent,
      { canvas: [{ type: 'line' as const, x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#dddddd' }], margin: [0, 20, 0, 8] as [number, number, number, number] },
      {
        text: `Exported from ArticleX on ${new Date().toLocaleDateString()}`,
        fontSize: 8,
        color: '#888888',
        italics: true,
        alignment: 'center' as const,
      },
    ],
    styles: {
      title: {
        fontSize: 22,
        bold: true,
        color: '#7c3aed',
        margin: [0, 0, 0, 10],
      },
      h1: { fontSize: 18, bold: true, color: '#7c3aed' },
      h2: { fontSize: 15, bold: true, color: '#7c3aed' },
      code: {
        fontSize: 9,
        font: 'Courier',
        background: '#f3f4f6',
        color: '#374151',
      },
    },
    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.6,
    },
    pageMargins: [60, 50, 60, 50],
  }

  pdfMake.createPdf(docDefinition).download(`${handle}-article.pdf`)
}
