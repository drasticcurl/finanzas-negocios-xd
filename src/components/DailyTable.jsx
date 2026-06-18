import { useMemo } from 'react'
import {
  computeEntryMetrics,
  formatMoney,
  formatNumber,
  breakEvenRoas,
} from '../lib/calculations.js'

export default function DailyTable({ entries, settings, onEdit, onDelete }) {
  const rows = useMemo(() => {
    return [...entries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((e) => ({ entry: e, m: computeEntryMetrics(e, settings) }))
  }, [entries, settings])

  const beRoas = breakEvenRoas(settings?.processorFeePct)
  const currency = settings?.currency || 'ARS'

  if (rows.length === 0) {
    return (
      <div className="card empty">
        <p>Todavía no cargaste ningún día.</p>
        <p className="muted">Empezá cargando la inversión y las ventas de hoy arriba.</p>
      </div>
    )
  }

  return (
    <div className="card table-card">
      <div className="table-head">
        <h2>Registros diarios</h2>
        <small className="muted">
          ROAS de equilibrio: <strong>{formatNumber(beRoas, 2)}</strong>
        </small>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th className="num">Inversión</th>
              <th className="num">Ventas</th>
              <th className="num">Compras</th>
              <th className="num">CPA</th>
              <th className="num">Ticket prom.</th>
              <th className="num">ROAS</th>
              <th className="num">Profit</th>
              <th className="num">Profit %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry, m }) => {
              const roasDisplay = m.roasCampaigns > 0 ? m.roasCampaigns : m.roasReal
              const lowRoas = roasDisplay > 0 && roasDisplay < beRoas
              return (
                <tr key={entry.id}>
                  <td className="date-cell">
                    {entry.date}
                    {entry.notes && <span className="note-dot" title={entry.notes}>•</span>}
                  </td>
                  <td className="num">{formatMoney(m.adSpend, currency)}</td>
                  <td className="num">{formatMoney(m.sales, currency)}</td>
                  <td className="num">{formatNumber(m.purchases, 0)}</td>
                  <td className="num">{m.cpa > 0 ? formatMoney(m.cpa, currency) : '—'}</td>
                  <td className="num">{m.aov > 0 ? formatMoney(m.aov, currency) : '—'}</td>
                  <td className={'num' + (lowRoas ? ' warn' : '')}>
                    {roasDisplay > 0 ? formatNumber(roasDisplay, 2) : '—'}
                  </td>
                  <td className={'num ' + (m.profit >= 0 ? 'pos' : 'neg')}>
                    {formatMoney(m.profit, currency)}
                  </td>
                  <td className={'num ' + (m.profit >= 0 ? 'pos' : 'neg')}>
                    {m.sales > 0 ? formatNumber(m.profitPct, 1) + '%' : '—'}
                  </td>
                  <td className="actions-cell">
                    <button className="icon-btn" onClick={() => onEdit(entry)} title="Editar">
                      ✎
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => {
                        if (confirm(`¿Borrar el registro del ${entry.date}?`)) onDelete(entry.id)
                      }}
                      title="Borrar"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
