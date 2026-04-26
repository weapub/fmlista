export const extractYouTubeVideoId = (value?: string | null): string | null => {
  if (!value) return null

  const raw = value.trim()
  if (!raw) return null

  // Allow passing only video ID.
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return raw
  }

  try {
    const url = new URL(raw)

    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').trim()
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }

    if (url.hostname.includes('youtube.com')) {
      const fromQuery = url.searchParams.get('v')
      if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) return fromQuery

      const parts = url.pathname.split('/').filter(Boolean)
      const possibleId = parts[parts.length - 1]
      if (possibleId && /^[a-zA-Z0-9_-]{11}$/.test(possibleId)) return possibleId
    }
  } catch {
    return null
  }

  return null
}

export const buildYouTubeThumbnailUrl = (videoId?: string | null) => {
  if (!videoId) return null
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export const buildYouTubeEmbedUrl = (videoId?: string | null) => {
  if (!videoId) return null
  return `https://www.youtube-nocookie.com/embed/${videoId}`
}

