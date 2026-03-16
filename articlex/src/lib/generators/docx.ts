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
import type { ArticleObject } from '../../types/article'

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

export const generateDOCX = async (article: ArticleObject): Promise<void> => {
  const handle = cleanHandle(article.authorHandle)
  const publishedDate = new Date(article.publishedAt).toLocaleString()
  const bodyParagraphs = article.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      new Paragraph({
        children: [new TextRun({ text: line, size: 22, font: 'Calibri' })],
        spacing: { after: 200 },
        alignment: AlignmentType.LEFT,
      }),
    )

  const imageParagraphs =
    article.images.length > 0
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
          ...article.images.map(
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
