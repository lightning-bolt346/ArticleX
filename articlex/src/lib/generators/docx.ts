import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
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
      runs.push(
        new TextRun({
          text: slice,
          size: 22,
          font: 'Calibri',
          bold: bold || undefined,
        }),
      )
    }
  }

  return runs
}

async function blocksToDocxParagraphs(
  blocks: ContentBlock[],
): Promise<Paragraph[]> {
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
              new TextRun({
                text: block.text,
                italics: true,
                size: 22,
                font: 'Calibri',
                color: '6B7280',
              }),
            ],
            indent: { left: 720 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 6, color: '7C3AED' },
            },
            spacing: { before: 120, after: 120 },
          }),
        )
        break

      case 'code-block':
        for (const line of block.text.split('\n')) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line || ' ',
                  size: 18,
                  font: 'Courier New',
                }),
              ],
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
            const w = Math.round(imgData.width * scale)
            const h = Math.round(imgData.height * scale)
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imgData.buffer,
                    transformation: { width: w, height: h },
                    type: 'jpg',
                  }),
                ],
                spacing: { before: 160, after: 160 },
                alignment: AlignmentType.CENTER,
              }),
            )
          } else {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `[Image: ${block.imageUrl}]`, size: 18, color: '888888' }),
                ],
                spacing: { before: 120, after: 120 },
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
  if (trailingImages.length > 0) {
    imageParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Attached Images:', bold: true, underline: {}, size: 22, font: 'Calibri' }),
        ],
        spacing: { before: 300, after: 140 },
      }),
    )
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
                transformation: {
                  width: Math.round(imgData.width * scale),
                  height: Math.round(imgData.height * scale),
                },
                type: 'jpg',
              }),
            ],
            spacing: { before: 80, after: 160 },
            alignment: AlignmentType.CENTER,
          }),
        )
      } else {
        imageParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${url}`, size: 18, color: '888888' })],
            spacing: { after: 120 },
          }),
        )
      }
    }
  }

  const doc = new Document({
    title: article.title ?? handle,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 2540, bottom: 2540, left: 2540, right: 2540 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${article.authorName} (@${handle}) · ${publishedDate}`,
                    italics: true,
                    color: '888888',
                    size: 18,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Exported from ArticleX · ', color: '888888', size: 16, font: 'Calibri' }),
                  new ExternalHyperlink({
                    children: [
                      new TextRun({
                        text: article.url,
                        color: '0563C1',
                        size: 16,
                        font: 'Calibri',
                        underline: { type: 'single' as const },
                      }),
                    ],
                    link: article.url,
                  }),
                  new TextRun({ text: ' · Page ', color: '888888', size: 16, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.CURRENT], color: '888888', size: 16 }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: article.authorName, bold: true, size: 22, font: 'Calibri' }),
              new TextRun({ text: ` (@${handle}) · ${publishedDate}`, size: 18, color: '06B6D4', font: 'Calibri' }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({ children: [new TextRun({ text: '', size: 12 })], spacing: { after: 100 } }),
          ...(article.title
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: article.title, bold: true, size: 36, color: '7C3AED', font: 'Calibri' }),
                  ],
                  heading: HeadingLevel.HEADING_1,
                  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '7C3AED' } },
                  spacing: { after: 260 },
                }),
              ]
            : []),
          ...bodyParagraphs,
          ...imageParagraphs,
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  triggerDownload(`${handle}-article.docx`, blob)
}
