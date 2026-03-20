export const TWEET_ID_REGEX = /(?:x\.com|twitter\.com)\/[^/]+\/status\/(\d+)/

export function normalizeTweetUrl(url: string): string {
  return url
    .trim()
    .replace('mobile.x.com', 'x.com')
    .replace('/article/', '/status/')
}

export function extractTweetId(url: string): string | null {
  return normalizeTweetUrl(url).match(TWEET_ID_REGEX)?.[1] ?? null
}
