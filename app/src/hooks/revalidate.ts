import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/**
 * Purge Next.js caches after edits so editors see changes immediately.
 * Safe to call outside a Next request (seed scripts): errors are ignored.
 */
export const revalidate =
  (paths: string[]): CollectionAfterChangeHook & CollectionAfterDeleteHook =>
  async ({ doc, req }) => {
    if (req.context?.disableRevalidate) return doc
    try {
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/', 'layout')
      for (const p of paths) revalidatePath(p)
    } catch {
      /* not in a Next.js runtime */
    }
    return doc
  }
