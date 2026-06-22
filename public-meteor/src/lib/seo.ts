import { useEffect } from 'react'
import { applyPageMeta } from '@cafe/shared-web'

const SITE = 'Meteor Community Cafe'
const DEFAULT_IMAGE = '/meteor-logo.png'

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
