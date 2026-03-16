import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  TextRun,
} from 'docx'
import type { ArticleObject, ContentBlock } from '../../types/article'

const cleanHandle = (handle: string): string => handle.replace(/^@/, '')

const triggerDownload = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function fetchImageData(
  url: string,
): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const buffer = await response.arrayBuffer()
    const blob = new Blob([buffer])
    const objectUrl = URL.createObjectURL(blob)
    const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = objectUrl
    })
    URL.revokeObjectURL(objectUrl)
    return { buffer, ...dims }
  } catch {
    return null
  }
}

function blockToRuns(block: ContentBlock): (TextRun | ExternalHyperlink)[] {
  const text = block.text
  const annotations = block.annotations
  if (annotations.length === 0) {
    return [new TextRun({ text, size: 22, font: 'Calibri' })]
  }

  const boundaries = new Set<number>([0, text.length])
  for (const ann of annotations) {
    boundaries.add(ann.offset)
    boundaries.add(Math.min(ann.offset + ann.length, text.length))
  }

  const sorted = Array.from(boundaries).sort((a, b) => a - b)
  const runs: (TextRun | ExternalHyperlink)[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]
    const end = sorted[i + 1]
    const slice = text.slice(start, end)
    if (!slice) continue

    let bold = false
    let link: string | undefined

    for (const ann of annotations) {
      if (ann.offset <= start && start < ann.offset + ann.length) {
        if (ann.type === 'bold') bold = true
        if (ann.type === 'link') link = ann.url
      }
    }

    if (link) {
      runs.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: slice,
              size: 22,
              font: 'Calibri',
              bold: bold || undefined,
              color: '0563C1',
              underline: { type: 'single' as const },
            }),
          ],
          link,
        }),
      )
    } else {
      runs.push(new TextRun({ text: slice, size: 22, font: 'Calibri', bold: bold || undefined }))
    }
  }

  return runs
}

async function blocksToDocxParagraphs(blocks: ContentBlock[]): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = []
  const imageCache = new Map<string, { buffer: ArrayBuffer; width: number; height: number } | null>()

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                size: block.level === 1 ? 32 : 28,
                font: 'Calibri',
                color: '7C3AED',
              }),
            ],
            heading: block.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
          }),
        )
        break

      case 'list-item':
        paragraphs.push(
          new Paragraph({
            children: blockToRuns(block),
            bullet: { level: 0 },
            spacing: { after: 80 },
            alignment: AlignmentType.LEFT,
          }),
        )
        break

      case 'blockquote':
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: block.text, italics: true, size: 22, font: 'Calibri', color: '6B7280' }),
            ],
            indent: { left: 720 },
            border: { left: { style: BorderStyle.SINGLE, size: 6, color: '7C3AED' } },
            spacing: { before: 120, after: 120 },
          }),
        )
        break

      case 'code-block':
        for (const line of block.text.split('\n')) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line || ' ', size: 18, font: 'Courier New' })],
              shading: { type: ShadingType.SOLID, color: 'F3F4F6', fill: 'F3F4F6' },
              spacing: { after: 0 },
              indent: { left: 200 },
            }),
          )
        }
        paragraphs.push(new Paragraph({ children: [], spacing: { after: 120 } }))
        break

      case 'image':
        if (block.imageUrl) {
          if (!imageCache.has(block.imageUrl)) {
            imageCache.set(block.imageUrl, await fetchImageData(block.imageUrl))
          }
          const imgData = imageCache.get(block.imageUrl)
          if (imgData) {
            const maxWidth = 500
            const scale = Math.min(maxWidth / imgData.width, 1)
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imgData.buffer,
                    transformation: { width: Math.round(imgData.width * scale), height: Math.round(imgData.height * scale) },
                    type: 'jpg',
                  }),
                ],
                spacing: { before: 160, after: 160 },
                alignment: AlignmentType.CENTER,
              }),
            )
          }
        }
        break

      default:
        paragraphs.push(
          new Paragraph({
            children: blockToRuns(block),
            spacing: { after: 200 },
            alignment: AlignmentType.LEFT,
          }),
        )
        break
    }
  }

  return paragraphs
}

export const generateDOCX = async (article: ArticleObject): Promise<void> => {
  const handle = cleanHandle(article.authorHandle)
  const publishedDate = new Date(article.publishedAt).toLocaleString()
  const hasRichContent = article.contentBlocks.length > 0

  const bodyParagraphs = hasRichContent
    ? await blocksToDocxParagraphs(article.contentBlocks)
    : article.body
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line, size: 22, font: 'Calibri' })],
              spacing: { after: 200 },
              alignment: AlignmentType.LEFT,
            }),
        )

  const trailingImages = hasRichContent ? [] : article.images
  const imageParagraphs: Paragraph[] = []
  for (const url of trailingImages) {
    const imgData = await fetchImageData(url)
    if (imgData) {
      const maxWidth = 500
      const scale = Math.min(maxWidth / imgData.width, 1)
      imageParagraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imgData.buffer,
              transformation: { width: Math.round(imgData.width * scale), height: Math.round(imgData.height * scale) },
              type: 'jpg',
            }),
          ],
          spacing: { before: 80, after: 160 },
          alignment: AlignmentType.CENTER,
        }),
      )
    }
  }

  const coverParagraphs: Paragraph[] = []
  if (article.coverImage) {
    const coverData = await fetchImageData(article.coverImage)
    if (coverData) {
      const maxWidth = 600
      const scale = Math.min(maxWidth / coverData.width, 1)
      coverParagraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: coverData.buffer,
              transformation: { width: Math.round(coverData.width * scale), height: Math.round(coverData.height * scale) },
              type: 'jpg',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.CENTER,
        }),
      )
    }
  }

  const doc = new Document({
    title: article.title ?? handle,
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        children: [
          ...(article.title
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: article.title, bold: true, size: 36, color: '7C3AED', font: 'Calibri' }),
                  ],
                  heading: HeadingLevel.HEADING_1,
                  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '7C3AED' } },
                  spacing: { after: 160 },
                }),
              ]
            : []),
          new Paragraph({
            children: [
              new TextRun({ text: article.authorName, bold: true, size: 22, font: 'Calibri' }),
              new TextRun({ text: `  (@${handle})`, size: 18, color: '06B6D4', font: 'Calibri' }),
              new TextRun({ text: `  ·  ${publishedDate}`, size: 18, color: '888888', font: 'Calibri' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Source: ', size: 16, color: '888888', font: 'Calibri' }),
              new ExternalHyperlink({
                children: [
                  new TextRun({
                    text: article.url,
                    size: 16,
                    color: '0563C1',
                    font: 'Calibri',
                    underline: { type: 'single' as const },
                  }),
                ],
                link: article.url,
              }),
            ],
            spacing: { after: 260 },
          }),
          ...coverParagraphs,
          ...bodyParagraphs,
          ...imageParagraphs,
          new Paragraph({
            children: [
              new TextRun({ text: '', size: 12 }),
            ],
            spacing: { before: 200 },
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'DDDDDD' } },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Exported from `, size: 16, color: '888888', font: 'Calibri', italics: true }),
              new TextRun({ text: 'ArticleX', size: 16, color: '7C3AED', font: 'Calibri', bold: true }),
              new TextRun({ text: ` · Free forever · `, size: 16, color: '888888', font: 'Calibri', italics: true }),
              new ExternalHyperlink({
                children: [
                  new TextRun({ text: 'articlex.app', size: 16, color: '0563C1', font: 'Calibri', underline: { type: 'single' as const } }),
                ],
                link: 'https://lightning-bolt346.github.io/ArticleX/',
              }),
              new TextRun({ text: ` · ${new Date().toLocaleDateString()}`, size: 16, color: '888888', font: 'Calibri', italics: true }),
            ],
            spacing: { before: 80 },
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  triggerDownload(`${handle}-article.docx`, blob)
}
