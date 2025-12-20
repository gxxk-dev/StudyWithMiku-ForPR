const PREFETCH_CACHE_NAME = 'streaming-music-cache'
const PREFETCH_KEY_PREFIX = 'meting_playlist_prefetch'
const PREFETCH_DURATION = 1000 * 60 * 60 * 12 // 12h
const MAX_PREFETCH_SONGS = 12

const getPrefetchKey = (platform = 'default', id = 'default') => {
  return `${PREFETCH_KEY_PREFIX}:${platform}:${id}`
}

const getLastPrefetch = (platform, id) => {
  try {
    return Number(localStorage.getItem(getPrefetchKey(platform, id)) || 0)
  } catch {
    return 0
  }
}

const markPrefetched = (platform, id) => {
  try {
    localStorage.setItem(getPrefetchKey(platform, id), Date.now().toString())
  } catch {
    // ignore quota errors
  }
}

const shouldPrefetch = (platform, id, force = false) => {
  if (force) return true
  const lastPrefetch = getLastPrefetch(platform, id)
  return Date.now() - lastPrefetch > PREFETCH_DURATION
}

const fetchAndCache = async (cache, url) => {
  try {
    const request = new Request(url, { mode: 'no-cors', credentials: 'omit' })
    const existing = await cache.match(request, { ignoreSearch: false })
    if (existing) {
      return true
    }

    const response = await fetch(request)
    if (!response) return false

    if (response.ok || response.type === 'opaque') {
      await cache.put(request, response.clone())
      return true
    }
  } catch (error) {
    console.warn('缓存歌曲失败:', url, error)
  }
  return false
}

export const prefetchPlaylistAudios = async (songs = [], options = {}) => {
  if (typeof window === 'undefined' || !('caches' in window)) return
  const { platform = 'netease', id = 'default', force = false } = options
  if (!Array.isArray(songs) || songs.length === 0) return
  if (!shouldPrefetch(platform, id, force)) return

  try {
    const cache = await caches.open(PREFETCH_CACHE_NAME)
    const uniqueUrls = Array.from(
      new Set(
        songs
          .map(song => song?.url)
          .filter(Boolean)
      )
    ).slice(0, MAX_PREFETCH_SONGS)

    if (uniqueUrls.length === 0) return

    for (const url of uniqueUrls) {
      // sequential fetch to avoid flooding the network
      await fetchAndCache(cache, url)
    }

    markPrefetched(platform, id)
  } catch (error) {
    console.error('预缓存歌曲文件失败:', error)
  }
}
