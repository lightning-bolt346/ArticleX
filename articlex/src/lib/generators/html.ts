import type { ArticleObject } from '../../types/article'

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const generateHtmlDocument = (article: ArticleObject): string => {
  const title = article.title ?? `Post by @${article.authorHandle}`
  const paragraphs = article.body
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; max-width: 760px; margin: 48px auto; padding: 0 20px; line-height: 1.7; color: #111827; }
    h1 { font-size: 2rem; margin-bottom: 0.6rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.4rem; }
    p { margin: 0 0 1rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">by @${escapeHtml(article.authorHandle)} · ${new Date(article.publishedAt).toLocaleString()}</p>
  ${paragraphs}
</body>
</html>`
}
