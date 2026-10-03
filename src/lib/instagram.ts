/** A social post we can show in an iframe. */
export interface SocialEmbed {
  /** iframe src */
  src: string
  /** The original link (for "open on Instagram/LinkedIn"). */
  url: string
  kind: 'post' | 'reel' | 'linkedin'
  provider: 'Instagram' | 'LinkedIn'
}

/**
 * Turns a post link into its official embed URL. Accepts Instagram posts and reels
 * (instagram.com/p/…, /reel/…, /tv/…) and public LinkedIn posts (linkedin.com/posts/…activity-123…),
 * with or without tracking parameters. Returns null for anything else (e.g. a profile link).
 */
export function socialEmbed(url: string): SocialEmbed | null {
  const ig = url.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/)
  if (ig) {
    const kind = ig[1] === 'p' ? 'post' : 'reel'
    const path = ig[1] === 'p' ? 'p' : 'reel'
    return { src: `https://www.instagram.com/${path}/${ig[2]}/embed/`, url, kind, provider: 'Instagram' }
  }
  const li = url.match(/linkedin\.com\/(?:posts|feed\/update)\/[^?\s]*?(?:activity[-:])(\d+)/)
  if (li) {
    return { src: `https://www.linkedin.com/embed/feed/update/urn:li:activity:${li[1]}`, url, kind: 'linkedin', provider: 'LinkedIn' }
  }
  return null
}

/** Drops share-tracking parameters (?igsh=, ?stkn=, ?utm_…) from a link. */
export const cleanInstagramUrl = (url: string) => url.split('?')[0]
