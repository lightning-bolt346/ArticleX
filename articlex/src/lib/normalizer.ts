export const normalizeArticleBody = (body: string): string =>
  body
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

export const extractTitleFromBody = (body: string): string | null => {
  const [firstLine] = normalizeArticleBody(body).split('\n')
  if (!firstLine) {
    return null
  }

  const candidate = firstLine.trim()
  if (candidate.length < 20 || candidate.length > 120) {
    return null
  }

  return candidate
}

export const countWords = (body: string): number => {
  const normalized = normalizeArticleBody(body)
  if (!normalized) {
    return 0
  }

  return normalized.split(/\s+/).length
}
