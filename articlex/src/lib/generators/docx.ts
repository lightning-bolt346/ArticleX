import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
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

function blockToTextRuns(block: ContentBlock): TextRun[] {
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
  const runs: TextRun[] = []

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

    const runOpts: ConstructorParameters<typeof TextRun>[0] = {
      text: slice,
      size: 22,
      font: 'Calibri',
      bold: bold || undefined,
      color: link ? '06B6D4' : undefined,
    }

    runs.push(new TextRun(runOpts))
  }

  return runs
}

function blocksToDocxParagraphs(blocks: ContentBlock[]): Paragraph[] {
  const paragraphs: Paragraph[] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                size: 28,
                font: 'Calibri',
                color: '7C3AED',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
          }),
        )
        break

      case 'list-item':
        paragraphs.push(
          new Paragraph({
            children: blockToTextRuns(block),
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
                color: '888888',
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

      case 'image':
        if (block.imageUrl) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Image: ${block.imageUrl}]`,
                  size: 18,
                  color: '888888',
                  font: 'Calibri',
                }),
              ],
              spacing: { before: 120, after: 120 },
            }),
          )
        }
        break

      default:
        paragraphs.push(
          new Paragraph({
            children: blockToTextRuns(block),
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
    ? blocksToDocxParagraphs(article.contentBlocks)
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
  const imageParagraphs =
    trailingImages.length > 0
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Attached Images:',
                bold: true,
                underline: {},
                size: 20,
                font: 'Calibri',
              }),
            ],
            spacing: { before: 220, after: 140 },
          }),
          ...trailingImages.map(
            (url) =>
              new Paragraph({
                children: [new TextRun({ text: `• ${url}`, size: 18, color: '888888' })],
                spacing: { after: 120 },
              }),
          ),
        ]
      : []

  const doc = new Document({
    title: article.title ?? handle,
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 2540,
              bottom: 2540,
              left: 2540,
              right: 2540,
            },
          },
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
                  new TextRun({
                    text: `Exported from ArticleX · ${article.url} · Page `,
                    color: '888888',
                    size: 16,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    color: '888888',
                    size: 16,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: article.authorName,
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
              new TextRun({
                text: ` (@${handle}) · ${publishedDate}`,
                size: 18,
                color: '06B6D4',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [new TextRun({ text: '', size: 12 })],
            spacing: { after: 100 },
          }),
          ...(article.title
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: article.title,
                      bold: true,
                      size: 36,
                      color: '7C3AED',
                      font: 'Calibri',
                    }),
                  ],
                  heading: HeadingLevel.HEADING_1,
                  border: {
                    bottom: {
                      style: BorderStyle.SINGLE,
                      size: 4,
                      color: '7C3AED',
                    },
                  },
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
