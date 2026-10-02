/** Turns a pasted video link into something we can embed. */
export type ParsedVideo =
  | { kind: 'embed'; provider: 'YouTube' | 'Vimeo'; src: string }
  | { kind: 'file'; src: string }
  | null

export function parseVideo(url: string): ParsedVideo {
  const u = url.trim()
  if (!u) return null

  // YouTube: watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID
  const yt = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) {
    // Privacy-enhanced domain; autoplay because it only loads after the viewer presses play.
    return { kind: 'embed', provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` }
  }

  // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID (optionally with a privacy hash)
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/)
  if (vm) {
    const hash = vm[2] ? `&h=${vm[2]}` : ''
    return { kind: 'embed', provider: 'Vimeo', src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&dnt=1${hash}` }
  }

  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(u)) return { kind: 'file', src: u }
  return null
}
