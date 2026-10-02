/**
 * Build-time SEO from the content files — one source of truth, nothing to keep in sync:
 *  - <title>, description, canonical, Open Graph + Twitter cards
 *  - JSON-LD (schema.org Person) for search engines
 *  - a <noscript> version of the whole portfolio as semantic HTML, for crawlers, link
 *    previewers and anyone without JavaScript
 *  - robots.txt and sitemap.xml
 */
import type { Plugin } from 'vite'
import { site } from '../src/content/site'
import { journeyChapters as chapters } from '../src/content'
import { works } from '../src/content/works'
import { experience } from '../src/content/experience'
import { skills } from '../src/content/skills'
import { awards, testimonials } from '../src/content/testimonials'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const abs = (path: string) => (/^https?:/.test(path) ? path : `${site.url}${path}`)

function head() {
  const title = `${site.fullName} — ${site.title}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.fullName,
    url: site.url,
    image: abs(site.photo),
    jobTitle: site.title,
    description: site.description,
    email: `mailto:${site.email}`,
    sameAs: site.socials.map((s) => s.url),
  }
  return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(site.description)}" />
    <link rel="canonical" href="${site.url}/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(site.name)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(site.description)}" />
    <meta property="og:url" content="${site.url}/" />
    <meta property="og:image" content="${abs(site.ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(`${site.name}'s portfolio: a glowing sun at the centre of a solar system`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(site.description)}" />
    <meta name="twitter:image" content="${abs(site.ogImage)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\u003c')}</script>`
}

/**
 * A static copy of the loading screen, painted before any JavaScript runs (fast first paint,
 * no white flash). React replaces it on mount with the identical live loader.
 */
function shell() {
  return `<div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#030409;color:#f3efe8;font:12px/1.4 system-ui,sans-serif">
      <div style="position:relative;width:112px;height:112px">
        <div style="position:absolute;inset:0;border:1px solid rgba(255,255,255,.1);border-radius:50%"></div>
        <div style="position:absolute;top:50%;left:50%;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:radial-gradient(circle,#fff1cf 0%,#ffb35c 45%,#ff7a1a 100%);box-shadow:0 0 28px 6px rgba(255,160,70,.55)"></div>
      </div>
      <p style="margin-top:48px;letter-spacing:.45em;text-transform:uppercase;color:rgba(255,255,255,.6)">${esc(site.name)}</p>
    </div>`
}

/** The full content as plain semantic HTML. */
function noscript() {
  const sections = chapters
    .filter((c) => c.kind !== 'intro')
    .map((c) => {
      let body = ''
      if (c.kind === 'about') body = `<p>${esc(site.bio)}</p><blockquote>${esc(site.philosophy)}</blockquote>`
      if (c.kind === 'disciplines')
        body = `<ul>${site.disciplines.map((d) => `<li><strong>${esc(d.name)}</strong> — ${esc(d.line)}</li>`).join('')}</ul>`
      if (c.kind === 'works' && c.category)
        body = `<ul>${works
          .filter((w) => w.category === c.category)
          .map(
            (w) =>
              `<li><h3>${esc(w.title)} (${w.year})</h3><p>${esc(w.role)}. ${esc(w.summary)}</p>${w.description
                .split(/\n\s*\n/)
                .map((p) => `<p>${esc(p)}</p>`)
                .join('')}</li>`,
          )
          .join('')}</ul>`
      if (c.kind === 'skills')
        body = skills.map((g) => `<h3>${esc(g.name)}</h3><p>${g.items.map(esc).join(', ')}</p>`).join('')
      if (c.kind === 'timeline')
        body = `<ol>${experience
          .map((r) => `<li><strong>${esc(r.title)}, ${esc(r.company)}</strong> (${esc(r.start)}–${esc(r.end)}).${r.summary ? ' ' + esc(r.summary) : ''}</li>`)
          .join('')}</ol>`
      if (c.kind === 'testimonials')
        body =
          testimonials.map((t) => `<blockquote>${esc(t.quote)} — ${esc(t.name)}, ${esc(t.title)}</blockquote>`).join('') +
          (awards.length ? `<ul>${awards.map((a) => `<li>${esc(a.title)}, ${esc(a.by)} (${a.year})</li>`).join('')}</ul>` : '')
      if (c.kind === 'contact')
        body = `<p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p><ul>${site.socials
          .map((s) => `<li><a href="${esc(s.url)}">${esc(s.label)}</a></li>`)
          .join('')}</ul>${site.resumeUrl ? `<p><a href="${esc(site.resumeUrl)}">Résumé (PDF)</a></p>` : ''}`
      return `<section id="${esc(c.id)}"><h2>${esc(c.heading)}</h2><p>${esc(c.intro)}</p>${body}</section>`
    })
    .join('')
  return `<noscript><style>.noscript{max-width:42rem;margin:0 auto;padding:3rem 1.5rem;font:16px/1.6 system-ui,sans-serif;color:#f3efe8}.noscript a{color:#ffb35c}</style><div class="noscript"><h1>${esc(site.fullName)}</h1><p>${esc(site.title)}</p><p>${esc(site.tagline)}</p>${sections}</div></noscript>`
}

export function seo(): Plugin {
  return {
    name: 'heliocentric-seo',
    transformIndexHtml(html) {
      return html
        .replace(/<title>.*?<\/title>\s*/s, '')
        .replace(/<meta name="description"[^>]*>\s*/, '')
        .replace('</head>', `${head()}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${shell()}</div>\n    ${noscript()}`)
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n` })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site.url}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`,
      })
    },
  }
}
