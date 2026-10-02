/**
 * Turns an Instagram post or reel link into its official embed URL.
 * Accepts instagram.com/p/<code>, /reel/<code> and /tv/<code>, with or without
 * tracking parameters. Returns null for anything else (e.g. a profile link).
 */
export function instagramEmbed(url: string): { src: string; kind: 'post' | 'reel' } | null {
  const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/)
  if (!m) return null
  const kind = m[1] === 'p' ? 'post' : 'reel'
  const path = m[1] === 'p' ? 'p' : 'reel'
  return { src: `https://www.instagram.com/${path}/${m[2]}/embed/captioned/`, kind }
}

/** Drops share-tracking parameters (?igsh=, ?stkn=, ?utm_…) from an Instagram link. */
export const cleanInstagramUrl = (url: string) => url.split('?')[0]
