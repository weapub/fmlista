import { useEffect } from 'react'

type SeoConfig = {
  title: string
  description: string
  keywords?: string
  image?: string | null
  url?: string
  type?: string
  siteName?: string
  robots?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

const DEFAULT_DESCRIPTION = 'Todas las radios de Formosa en un solo lugar. Escucha en vivo y mantente informado.'
const DEFAULT_SITE_NAME = 'FM Lista'
const DEFAULT_IMAGE = '/apple-touch-icon.png'

const ensureMetaTag = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value)
  })

  return element
}

const ensureLinkTag = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null

  if (!element) {
    element = document.createElement('link')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value)
  })

  return element
}

const upsertJsonLdScript = (jsonLd?: SeoConfig['jsonLd']) => {
  const scriptId = 'seo-json-ld'
  const existing = document.getElementById(scriptId)

  if (!jsonLd) {
    existing?.remove()
    return
  }

  const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
  const script = existing ?? document.createElement('script')
  script.id = scriptId
  script.setAttribute('type', 'application/ld+json')
  script.textContent = JSON.stringify(payload)

  if (!existing) {
    document.head.appendChild(script)
  }
}

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined
  if (/^https?:\/\//i.test(value)) return value

  if (typeof window === 'undefined') return value
  return new URL(value, window.location.origin).toString()
}

export const useSeo = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  siteName = DEFAULT_SITE_NAME,
  robots = 'index,follow',
  jsonLd,
}: SeoConfig) => {
  useEffect(() => {
    const resolvedDescription = description || DEFAULT_DESCRIPTION
    const resolvedUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
    const resolvedImage = toAbsoluteUrl(image || DEFAULT_IMAGE) || DEFAULT_IMAGE

    document.title = title

    ensureMetaTag('meta[name="description"]', {
      name: 'description',
      content: resolvedDescription,
    })

    if (keywords) {
      ensureMetaTag('meta[name="keywords"]', {
        name: 'keywords',
        content: keywords,
      })
    }

    ensureMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: robots,
    })

    ensureMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: title,
    })

    ensureMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: resolvedDescription,
    })

    ensureMetaTag('meta[property="og:type"]', {
      property: 'og:type',
      content: type,
    })

    ensureMetaTag('meta[property="og:url"]', {
      property: 'og:url',
      content: resolvedUrl,
    })

    ensureMetaTag('meta[property="og:image"]', {
      property: 'og:image',
      content: resolvedImage,
    })

    ensureMetaTag('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: siteName,
    })

    ensureMetaTag('meta[property="og:locale"]', {
      property: 'og:locale',
      content: 'es_AR',
    })

    ensureMetaTag('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    })

    ensureMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: title,
    })

    ensureMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: resolvedDescription,
    })

    ensureMetaTag('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: resolvedImage,
    })

    ensureLinkTag('link[rel="canonical"]', {
      rel: 'canonical',
      href: resolvedUrl,
    })

    upsertJsonLdScript(jsonLd)
  }, [title, description, keywords, image, url, type, siteName, robots, jsonLd])
}
