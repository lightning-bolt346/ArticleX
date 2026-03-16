export const enum FxTwitterErrorCode {
  INVALID_URL = 'INVALID_URL',
  NOT_FOUND = 'NOT_FOUND',
  API_ERROR = 'API_ERROR',
  TWEET_ERROR = 'TWEET_ERROR',
  PRIVATE_TWEET = 'PRIVATE_TWEET',
}

export interface FxTwitterError {
  code: FxTwitterErrorCode
  status?: number
  message?: string
}

const FX_URL_REGEX = /(?:x\.com|twitter\.com)\/([^/]+)\/status\/(\d+)/

const makeError = (
  code: FxTwitterErrorCode,
  options?: Pick<FxTwitterError, 'status' | 'message'>,
): FxTwitterError => ({
  code,
  ...options,
})

const parseUrl = (url: string): { username: string; tweetId: string } => {
  const normalizedUrl = url
    .trim()
    .replace('mobile.x.com', 'x.com')
    .replace('/article/', '/status/')

  const match = normalizedUrl.match(FX_URL_REGEX)
  if (!match) {
    throw makeError(FxTwitterErrorCode.INVALID_URL)
  }

  const [, username, tweetId] = match
  return { username, tweetId }
}

export const fetchTweet = async (url: string): Promise<Record<string, unknown>> => {
  const { username, tweetId } = parseUrl(url)

  const response = await fetch(`https://api.fxtwitter.com/${username}/status/${tweetId}`)
  if (response.status === 404) {
    throw makeError(FxTwitterErrorCode.NOT_FOUND)
  }

  if (!response.ok) {
    throw makeError(FxTwitterErrorCode.API_ERROR, { status: response.status })
  }

  const payload = await response.json()

  if (payload?.code !== 200) {
    const message = String(payload?.message ?? '').toLowerCase()
    if (message.includes('private')) {
      throw makeError(FxTwitterErrorCode.PRIVATE_TWEET)
    }

    throw makeError(FxTwitterErrorCode.TWEET_ERROR)
  }

  return payload
}
