const METING_API = 'https://api.injahow.cn/meting/'
const DEFAULT_PLAYLIST_ID = '17543418420'
const PLAYLIST_CACHE_PREFIX = 'meting_playlist_cache'
const PLAYLIST_CACHE_DURATION = 1000 * 60 * 60 * 12 // 12h cache

export { DEFAULT_PLAYLIST_ID }

const getCacheKey = (platform, id) => {
  return `${PLAYLIST_CACHE_PREFIX}:${platform}:${id}`
}

const isCacheExpired = (timestamp = 0) => {
  return Date.now() - timestamp > PLAYLIST_CACHE_DURATION
}

export const fetchPlaylist = async (server = 'netease', id = DEFAULT_PLAYLIST_ID) => {
  const url = `${METING_API}?server=${server}&type=playlist&id=${id}`
  
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('网络错误/(ㄒoㄒ)/~~')
    
    const data = await response.json()
    
    return data.map(song => ({
      name: song.title || song.name,
      artist: song.author || song.artist,
      url: song.url,
      cover: song.pic || song.cover,
      lrc: song.lrc
    }))
  } catch (error) {
    console.error('Meting API错误:', error)
    return []
  }
}

export const getCachedPlaylist = (platform, id) => {
  try {
    const key = getCacheKey(platform, id)
    const cached = localStorage.getItem(key)
    if (!cached) {
      return null
    }

    const parsed = JSON.parse(cached)
    const songs = Array.isArray(parsed?.songs) ? parsed.songs : []
    const timestamp = parsed?.timestamp || 0

    return {
      songs,
      timestamp,
      isExpired: isCacheExpired(timestamp)
    }
  } catch (error) {
    console.error('读取歌单缓存失败:', error)
    localStorage.removeItem(getCacheKey(platform, id))
    return null
  }
}

export const cachePlaylist = (platform, id, playlist) => {
  try {
    const key = getCacheKey(platform, id)
    const payload = JSON.stringify({
      timestamp: Date.now(),
      songs: playlist
    })
    localStorage.setItem(key, payload)
  } catch (error) {
    console.error('缓存歌单失败:', error)
  }
}

export const clearPlaylistCache = (platform, id) => {
  localStorage.removeItem(getCacheKey(platform, id))
}

export const getStoredConfig = () => {
  return {
    platform: localStorage.getItem('music_platform') || 'netease',
    id: DEFAULT_PLAYLIST_ID
  }
}

export const saveConfig = (platform, id) => {
  localStorage.setItem('music_platform', platform)
  localStorage.setItem('music_id', id)
}
