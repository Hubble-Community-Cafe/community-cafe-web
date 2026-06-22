/**
 * Per-page SEO/OpenGraph meta, applied to the document head at runtime. Pure DOM (no React, no
 * dependency) so it stays in shared-web; each app wraps it in a small useEffect hook. Cookieless.
 */
export interface PageMeta {
  /** The full document title (the caller already appends the site name). */
  title: string
  description: string
  siteName: string
  /** OpenGraph/Twitter image (root-relative or absolute). */
  image?: string
  /** og:type, defaults to "website". */
  type?: string
  /** Canonical URL; defaults to the current origin + path. */
  canonical?: string
  /** Force noindex (e.g. the 404 page). Defaults to the host-based rule. */
  index?: boolean
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function toAbsolute(url: string): string {
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}

/**
 * Only the live apex domains should be indexed. The same container image serves the `test.*`
 * subdomains and previews, so keep those out of search engines to avoid duplicate content.
 */
function isIndexable(): boolean {
  const host = window.location.hostname
  return !(host.startsWith('test.') || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local'))
}

/** Set the document title plus description, canonical, OpenGraph and Twitter card meta. */
export function applyPageMeta(meta: PageMeta): void {
  document.title = meta.title
  const url = meta.canonical ?? window.location.origin + window.location.pathname

  const indexable = meta.index === false ? false : isIndexable()
  upsertMeta('name', 'robots', indexable ? 'index,follow' : 'noindex,nofollow')
  upsertMeta('name', 'description', meta.description)
  upsertCanonical(url)
  upsertMeta('property', 'og:title', meta.title)
  upsertMeta('property', 'og:description', meta.description)
  upsertMeta('property', 'og:type', meta.type ?? 'website')
  upsertMeta('property', 'og:site_name', meta.siteName)
  upsertMeta('property', 'og:url', url)
  upsertMeta('name', 'twitter:title', meta.title)
  upsertMeta('name', 'twitter:description', meta.description)

  if (meta.image) {
    const img = toAbsolute(meta.image)
    upsertMeta('property', 'og:image', img)
    upsertMeta('name', 'twitter:image', img)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
  } else {
    upsertMeta('name', 'twitter:card', 'summary')
  }
}
