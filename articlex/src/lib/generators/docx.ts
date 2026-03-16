import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import type { ArticleObject } from '../../types/article'

export const generateDocxBlob = async (article: ArticleObject): Promise<Blob> => {
  const title = article.title ?? `Post by @${article.authorHandle}`
  const bodyParagraphs = article.body
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) =>
      new Paragraph({
        children: [new TextRun(line)],
      }),
    )

  const document = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(title)],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `@${article.authorHandle} · ${new Date(article.publishedAt).toLocaleString()}`,
                italics: true,
              }),
            ],
          }),
          ...bodyParagraphs,
        ],
      },
    ],
  })

  return Packer.toBlob(document)
}
