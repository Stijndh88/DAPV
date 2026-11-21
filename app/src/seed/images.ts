import sharp from 'sharp'

/** Generates calm, on-brand placeholder photos (sky / water / reeds) so the demo looks complete without stock images. */
export async function placeholderPhoto(seed: number, label?: string, w = 1600, h = 1067): Promise<Buffer> {
  const rand = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280
    return x - Math.floor(x)
  }
  const horizon = Math.round(h * (0.42 + rand(1) * 0.2))
  const skyTop = ['#c9d9d6', '#d8e2df', '#b9cfd3', '#e3d9c4'][seed % 4]
  const skyBot = ['#eef2ef', '#f3efe4', '#dde8e6', '#f1e6d2'][seed % 4]
  const water = ['#2e5d63', '#1f4a52', '#3a6a6a', '#284f55'][(seed + 1) % 4]
  const reeds = Array.from({ length: 40 }, (_, i) => {
    const x = Math.round(rand(10 + i) * w)
    const rh = 40 + rand(60 + i) * 180
    const lean = (rand(120 + i) - 0.5) * 30
    return `<path d="M${x} ${horizon + 6} q ${lean / 2} ${-rh / 2} ${lean} ${-rh}" stroke="#55643a" stroke-width="${2 + rand(200 + i) * 3}" fill="none" opacity="0.8"/>`
  }).join('')
  const ripples = Array.from({ length: 14 }, (_, i) => {
    const y = horizon + 20 + i * ((h - horizon) / 14)
    const x = rand(300 + i) * w * 0.8
    return `<path d="M${x} ${y} h ${80 + rand(400 + i) * 260}" stroke="#9fc9c2" stroke-width="2" opacity="${0.15 + rand(500 + i) * 0.3}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBot}"/></linearGradient>
      <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${water}" stop-opacity="0.85"/><stop offset="1" stop-color="#0e3b43"/></linearGradient>
    </defs>
    <rect width="${w}" height="${horizon}" fill="url(#s)"/>
    <path d="M0 ${horizon} C ${w * 0.2} ${horizon - 40}, ${w * 0.35} ${horizon - 10}, ${w * 0.55} ${horizon - 30} S ${w * 0.85} ${horizon - 20}, ${w} ${horizon - 35} V ${horizon} Z" fill="#6f7f5a" opacity="0.7"/>
    <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#w)"/>
    ${ripples}
    ${reeds}
    ${label ? `<text x="40" y="${h - 40}" font-family="sans-serif" font-size="28" fill="#e6edea" opacity="0.7">${label}</text>` : ''}
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer()
}
