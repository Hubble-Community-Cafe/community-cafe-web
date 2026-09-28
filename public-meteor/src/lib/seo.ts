import { useEffect } from 'react'
import { applyPageMeta } from '@cafe/shared-web'

const SITE = 'Meteor Community Cafe'
// Link-preview image, 1200x630 (the 1.91:1 ratio WhatsApp, Facebook and LinkedIn crop to).
const DEFAULT_IMAGE = '/og-image.jpg'

/**
 * Set per-page SEO meta. `title` is the page name (the site name is appended); pass an empty
 * string on the home page to use the site name alone.
 */
export function usePageSeo(
  title: string,
  description: string,
  opts?: { image?: string; index?: boolean },
): void {
  const image = opts?.image ?? DEFAULT_IMAGE
  const index = opts?.index
  useEffect(() => {
    applyPageMeta({
      title: title ? `${title} | ${SITE}` : SITE,
      description,
      siteName: SITE,
      image,
      index,
    })
  }, [title, description, image, index])
}
