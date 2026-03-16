import type { ArticleObject } from '../../types/article'

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const cleanHandle = (handle: string): string => handle.replace(/^@/, '')

const triggerDownload = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/html' })
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

export const generateHTML = (article: ArticleObject): void => {
  const handle = cleanHandle(article.authorHandle)
  const title = article.title ?? `@${handle} on X`
  const published = new Date(article.publishedAt).toLocaleString()
  const exportDate = new Date().toLocaleDateString()
  const paragraphs = article.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('\n')

  const imagesBlock =
    article.images.length > 0
      ? `
  <section class="images-grid">
    ${article.images
      .map(
        (image, index) =>
          `<img src="${escapeHtml(image)}" alt="Image ${index + 1}" loading="lazy" />`,
      )
      .join('\n    ')}
  </section>`
      : ''

  const titleBlock = article.title
    ? `<div class="title">${escapeHtml(article.title)}</div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0f;
      color: #f0f0ff;
      max-width: 720px;
      margin: 0 auto;
      padding: 60px 24px 120px;
      line-height: 1.75;
      font-size: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px solid rgba(124,58,237,0.5);
      object-fit: cover;
      background: linear-gradient(135deg, #7c3aed, #06b6d4);
    }
    .author-name {
      font-size: 16px;
      font-weight: 600;
      color: #f0f0ff;
      margin: 0;
    }
    .author-handle {
      font-size: 13px;
      color: #06b6d4;
      font-family: 'Courier New', monospace;
      margin: 4px 0 0;
    }
    .author-date {
      font-size: 12px;
      color: #6b7280;
      margin: 2px 0 0;
    }
    .title {
      font-size: 32px;
      font-weight: 800;
      color: #f0f0ff;
      line-height: 1.2;
      margin-bottom: 32px;
      letter-spacing: -0.02em;
      border-left: 3px solid #7c3aed;
      padding-left: 20px;
    }
    .body-text p {
      margin: 0 0 1.5em;
      font-size: 16px;
      color: rgba(240,240,255,0.85);
      line-height: 1.85;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin: 40px 0;
    }
    .images-grid img {
      width: 100%;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .footer {
      margin-top: 64px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.06);
      font-size: 12px;
      color: #6b7280;
      font-family: 'Courier New', monospace;
    }
    .source-badge {
      display: inline-flex;
      align-items: center;
      background: rgba(124,58,237,0.15);
      border: 1px solid rgba(124,58,237,0.3);
      border-radius: 8px;
      padding: 8px 16px;
      color: #7c3aed;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      margin-top: 12px;
    }
    .source-badge:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <header class="header">
    <img class="avatar" src="${escapeHtml(article.authorAvatar)}" alt="${escapeHtml(article.authorName)}" />
    <div>
      <p class="author-name">${escapeHtml(article.authorName)}</p>
      <p class="author-handle">@${escapeHtml(handle)}</p>
      <p class="author-date">${escapeHtml(published)}</p>
    </div>
  </header>

  ${titleBlock}

  <main class="body-text">
    ${paragraphs}
  </main>

  ${imagesBlock}

  <footer class="footer">
    <div>Exported with ArticleX · Original post → <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.url)}</a></div>
    <a class="source-badge" href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">View Source</a>
    <div style="margin-top: 12px;">Exported on ${escapeHtml(exportDate)}</div>
  </footer>
</body>
</html>`

  triggerDownload(`${handle}-article.html`, html)
}
