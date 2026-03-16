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

interface SyndicationTweet {
  id_str: string
  text: string
  in_reply_to_status_id_str?: string
  in_reply_to_screen_name?: string
  user?: { screen_name?: string; name?: string; profile_image_url_https?: string }
  entities?: { urls?: { expanded_url?: string; display_url?: string }[] }
  favorite_count?: number
  created_at?: string
}

async function fetchSyndicationTweet(tweetId: string): Promise<SyndicationTweet | null> {
  try {
    const response = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en&token=x`,
    )
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function fetchThreadTweets(
  rootId: string,
  authorScreenName: string,
): Promise<SyndicationTweet[]> {
  const TWITTER_EPOCH = 1288834974657
  const rootTimestamp = (BigInt(rootId) >> 22n) + BigInt(TWITTER_EPOCH)
  const collected: SyndicationTweet[] = []
  let currentParentId = rootId

  for (let step = 0; step < 60; step++) {
    const parentTs = step === 0
      ? rootTimestamp
      : (BigInt(currentParentId) >> 22n) + BigInt(TWITTER_EPOCH)

    const offsets = [15, 30, 45, 60, 90, 120, 180]
    let found: SyndicationTweet | null = null

    const checks = offsets.map((sec) => {
      const candidateTs = parentTs + BigInt(sec * 1000)
      const baseId = (candidateTs - BigInt(TWITTER_EPOCH)) << 22n
      return fetchSyndicationTweet(baseId.toString())
    })

    const results = await Promise.all(checks)
    for (const tweet of results) {
      if (
        tweet &&
        tweet.in_reply_to_status_id_str === currentParentId &&
        tweet.user?.screen_name?.toLowerCase() === authorScreenName.toLowerCase()
      ) {
        found = tweet
        break
      }
    }

    if (!found) break

    collected.push(found)
    currentParentId = found.id_str
  }

  return collected
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

export const fetchThread = async (
  url: string,
): Promise<{ payload: Record<string, unknown>; threadTweets: SyndicationTweet[] }> => {
  const { username } = parseUrl(url)
  const payload = await fetchTweet(url)

  const tweet = (payload.tweet ?? {}) as Record<string, unknown>
  const isThreadCandidate =
    !tweet.replying_to &&
    !tweet.replying_to_status &&
    !tweet.article &&
    typeof tweet.text === 'string' &&
    (tweet.text as string).length < 500 &&
    (tweet.replies as number) > 0

  if (!isThreadCandidate) {
    return { payload, threadTweets: [] }
  }

  const threadTweets = await fetchThreadTweets(
    String(tweet.id ?? ''),
    username,
  )

  return { payload, threadTweets }
}
