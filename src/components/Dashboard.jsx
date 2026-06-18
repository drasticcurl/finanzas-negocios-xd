import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  buildMonthlySummaries,
  formatMoney,
  formatNumber,
  breakEvenRoas,
} from '../lib/calculations.js'

function Metric({ label, value, sub, tone }) {
  return (
    <div className={'metric' + (tone ? ' metric-' + tone : '')}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {sub && <span className="metric-sub">{sub}</span>}
    </div>
  )
}

export default function Dashboard({ entries, settings }) {
  const summaries = useMemo(
    () => buildMonthlySummaries(entries, settings),
    [entries, settings],
  )
  const [selectedKey, setSelectedKey] = useState(null)
  const currency = settings?.currency || 'ARS'
  const beRoas = breakEvenRoas(settings?.processorFeePct)

  if (summaries.length === 0) {
    return (
      <div className="card empty">
        <p>Sin datos para mostrar todavía.</p>
        <p className="muted">Cargá algunos días y acá vas a ver el resumen y los gráficos.</p>
      </div>
    )
  }

  const current = summaries.find((s) => s.key === selectedKey) || summaries[0]
  const t = current.totals
  const a = current.averages

  return (
    <div className="dashboard">
      <div className="card">
        <div className="table-head">
          <h2>Resumen mensual</h2>
          <select
            className="month-select"
            value={current.key}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            {summaries.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} ({s.count} días)
              </option>
            ))}
          </select>
        </div>

        <div className="metrics-grid">
          <Metric label="Inversión total" value={formatMoney(t.adSpend, currency)} />
          <Metric label="Ventas totales" value={formatMoney(t.sales, currency)} />
          <Metric
            label="Profit del mes"
            value={formatMoney(t.profit, currency)}
            tone={t.profit >= 0 ? 'pos' : 'neg'}
            sub={`Margen ${formatNumber(a.profitPct, 1)}%`}
          />
          <Metric label="Compras" value={formatNumber(t.purchases, 0)} />
          <Metric
            label="ROAS promedio"
            value={a.roas > 0 ? formatNumber(a.roas, 2) : '—'}
            sub={`Equilibrio: ${formatNumber(beRoas, 2)}`}
            tone={a.roas > 0 ? (a.roas >= beRoas ? 'pos' : 'neg') : null}
          />
          <Metric label="CPA promedio" value={a.cpa > 0 ? formatMoney(a.cpa, currency) : '—'} />
          <Metric label="Ticket promedio" value={a.aov > 0 ? formatMoney(a.aov, currency) : '—'} />
          <Metric
            label="Comisión procesador"
            value={formatMoney(t.processorCost, currency)}
            sub={`${formatNumber(settings?.processorFeePct, 2)}% s/ ventas`}
          />
        </div>
      </div>

      <div className="card chart-card">
        <h3>Profit por día</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={current.daily} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#26303b" />
            <XAxis dataKey="day" stroke="#7b8794" fontSize={12} />
            <YAxis stroke="#7b8794" fontSize={12} width={56} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => formatMoney(v, currency)}
              labelFormatter={(l) => `Día ${l}`}
            />
            <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
              {current.daily.map((d, i) => (
                <Cell key={i} fill={d.profit >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3>Ventas vs. Inversión</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={current.daily} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#26303b" />
            <XAxis dataKey="day" stroke="#7b8794" fontSize={12} />
            <YAxis stroke="#7b8794" fontSize={12} width={56} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => formatMoney(v, currency)}
              labelFormatter={(l) => `Día ${l}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="sales" name="Ventas" stroke="#38bdf8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="adSpend" name="Inversión" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const tooltipStyle = {
  background: '#161d26',
  border: '1px solid #2a3441',
  borderRadius: 8,
  color: '#e6edf3',
  fontSize: 13,
}
