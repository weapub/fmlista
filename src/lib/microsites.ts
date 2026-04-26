import { Radio } from '@/types/database'

const RESERVED_SLUGS = new Set([
  '',
  'admin',
  'blog',
  'library',
  'login',
  'planes',
  'programas',
  'privacidad',
  'radio',
  'terminos',
])

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1'])

export const isReservedMicrositeSlug = (slug?: string | null) => {
  return !slug || RESERVED_SLUGS.has(slug.toLowerCase())
}

export const getRadioPath = (radio?: Pick<Radio, 'id' | 'slug'> | null) => {
  if (!radio?.id) return '/'
  if (radio.slug && !isReservedMicrositeSlug(radio.slug)) {
    return `/${radio.slug}`
  }
  return `/radio/${radio.id}`
}

export const getMicrositeSlugFromHostname = (hostname = window.location.hostname) => {
  const normalizedHost = hostname.toLowerCase()

  if (LOCALHOST_HOSTS.has(normalizedHost)) return null

  const parts = normalizedHost.split('.')
  if (parts.length < 3) return null

  const subdomain = parts[0]
  if (!subdomain || subdomain === 'www' || isReservedMicrositeSlug(subdomain)) {
    return null
  }

  return subdomain
}

export const shouldRenderMicrositeAtRoot = (pathname = window.location.pathname, hostname = window.location.hostname) => {
  return pathname === '/' && !!getMicrositeSlugFromHostname(hostname)
}
