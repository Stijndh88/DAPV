import type { Media } from '@/payload-types'

type Props = {
  media?: Media | number | string | null
  size?: 'thumb' | 'card' | 'large'
  className?: string
  sizes?: string
  priority?: boolean
  alt?: string
}

/** Responsive <img> using the sizes Payload generated. */
export function Img({ media, size = 'card', className, sizes = '100vw', priority, alt }: Props) {
  if (!media || typeof media !== 'object' || !media.url) return null
  const s = media.sizes
  const srcSet = [
    s?.thumb?.url && `${s.thumb.url} ${s.thumb.width}w`,
    s?.card?.url && `${s.card.url} ${s.card.width}w`,
    s?.large?.url && `${s.large.url} ${s.large.width}w`,
  ]
    .filter(Boolean)
    .join(', ')
  const src = s?.[size]?.url || media.url
  const fx = media.focalX ?? 50
  const fy = media.focalY ?? 50
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet || undefined}
      sizes={sizes}
      alt={alt ?? media.alt ?? ''}
      width={s?.[size]?.width ?? media.width ?? undefined}
      height={s?.[size]?.height ?? media.height ?? undefined}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      style={{ objectPosition: `${fx}% ${fy}%` }}
    />
  )
}
