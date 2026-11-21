import type { SiteSetting, Water } from '@/payload-types'
import { baitLabel } from '@/lib/bait'
import { BaitLabels } from './BaitIcon'

type Mode = 'continuous' | 'twoPart' | null

/**
 * The water's voederblad as labels: what may go in the water, what may go on the hook,
 * how much, and the club's own rules on top. `mode` picks the club rules for one match.
 */
export function FeedRules({ water, settings, mode = null, headingLevel = 2 }: { water: Water | null; settings: SiteSetting; mode?: Mode; headingLevel?: 2 | 3 }) {
  const f = water?.feeding
  const clubRules = (settings.feedRules ?? []).filter((r) => !mode || !r.appliesTo || r.appliesTo === 'all' || r.appliesTo === mode)
  const hasWaterRules = !!f && !!(f.feedAllowed?.length || f.feedForbidden?.length || f.hookAllowed?.length || f.hookForbidden?.length || f.shallow)
  if (!hasWaterRules && !clubRules.length) return null
  const H = `h${headingLevel}` as const
  const Sub = `h${headingLevel + 1}` as 'h3' | 'h4'
  const flags = [
    f?.shallow === 'ja' && { ok: true, text: 'Ondiep vissen mag' },
    f?.shallow === 'nee' && { ok: false, text: 'Ondiep vissen mag niet' },
    f?.clubKeepnet && { ok: true, text: 'Leefnet van de club' },
    f?.clubPellets && { ok: true, text: 'Korrels koop je in de club' },
  ].filter(Boolean) as { ok: boolean; text: string }[]

  return (
    <section className="feed" aria-labelledby="feed-title">
      <H id="feed-title">Voeders en aas</H>
      {hasWaterRules ? (
        <>
          {flags.length > 0 && (
            <ul className="feed__flags">
              {flags.map((x) => (
                <li key={x.text} className={x.ok ? '' : 'is-no'}>
                  {x.text}
                </li>
              ))}
            </ul>
          )}
          <div className="feed__grid">
            <div>
              <Sub>Voederen</Sub>
              <BaitLabels kinds={f!.feedAllowed} />
              <BaitLabels kinds={f!.feedForbidden} forbidden />
            </div>
            <div>
              <Sub>Aan de haak</Sub>
              <BaitLabels kinds={f!.hookAllowed} />
              <BaitLabels kinds={f!.hookForbidden} forbidden />
            </div>
          </div>
          {(f!.limits?.length || f!.note) && (
            <div className="feed__limits">
              <Sub>Hoeveel mag je meebrengen?</Sub>
              {f!.limits?.length ? (
                <dl>
                  {f!.limits.map((l) => (
                    <div key={l.id ?? l.amount}>
                      <dt>{(l.baits ?? []).map(baitLabel).join(' + ')}</dt>
                      <dd>{l.amount}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {f!.note && <p className="pre">{f!.note}</p>}
            </div>
          )}
        </>
      ) : (
        <p className="muted">Voor dit water staan nog geen voederregels op de site. Vraag het bij de loting.</p>
      )}
      {clubRules.length > 0 && (
        <div className="feed__club">
          <Sub>Altijd in onze club</Sub>
          <ul>
            {clubRules.map((r) => (
              <li key={r.id ?? r.text}>{r.text}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
