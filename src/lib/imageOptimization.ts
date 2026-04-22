type OptimizeOptions = {
  width?: number
  height?: number
  quality?: number
  resize?: 'cover' | 'contain'
}

const SUPABASE_PUBLIC_SEGMENT = '/storage/v1/object/public/'
const SUPABASE_RENDER_SEGMENT = '/storage/v1/render/image/public/'

const isAnimatedOrVector = (url: string) => {
  const lower = url.toLowerCase()
  return lower.includes('.gif') || lower.includes('.svg')
}

export const optimizeSupabaseImageUrl = (url?: string | null, options: OptimizeOptions = {}) => {
  if (!url) return ''
  if (!url.includes(SUPABASE_PUBLIC_SEGMENT)) return url
  if (isAnimatedOrVector(url)) return url

  try {
    const parsed = new URL(url)
    parsed.pathname = parsed.pathname.replace(SUPABASE_PUBLIC_SEGMENT, SUPABASE_RENDER_SEGMENT)

    if (options.width) parsed.searchParams.set('width', String(options.width))
    if (options.height) parsed.searchParams.set('height', String(options.height))
    if (options.quality) parsed.searchParams.set('quality', String(options.quality))
    if (options.resize) parsed.searchParams.set('resize', options.resize)

    return parsed.toString()
  } catch {
    return url
  }
}
