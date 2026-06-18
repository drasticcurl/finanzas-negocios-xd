// Cálculo de métricas por día y por mes.
//
// Modelo del negocio:
// - Productos digitales => sin costo de mercadería (COGS = 0).
// - Único costo variable: comisión del procesador de pagos (% sobre ventas).
// - Costos fijos mensuales opcionales, prorrateados por día del mes.

import { toNumber } from './storage.js'

// Cantidad de días del mes correspondiente a una fecha 'YYYY-MM-DD'.
export function daysInMonthOf(dateStr) {
  if (!dateStr) return 30
  const [y, m] = dateStr.split('-').map(Number)
  if (!y || !m) return 30
  return new Date(y, m, 0).getDate()
}

export function monthKey(dateStr) {
  return (dateStr || '').slice(0, 7) // 'YYYY-MM'
}

export function monthLabel(key) {
  if (!key) return ''
  const [y, m] = key.split('-').map(Number)
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  return `${meses[(m || 1) - 1]} ${y}`
}

// ROAS de equilibrio: mínimo necesario para no perder plata con los costos
// variables (acá, solo la comisión del procesador). Por debajo de esto,
// cada venta extra resta profit aunque el ROAS sea mayor a 1.
export function breakEvenRoas(processorFeePct) {
  const fee = toNumber(processorFeePct, 0) / 100
  const margin = 1 - fee
  if (margin <= 0) return Infinity
  return 1 / margin
}

// ROAS promedio de las campañas de un registro (simple, no ponderado).
export function avgCampaignRoas(campaigns = []) {
  const valid = campaigns.filter((c) => toNumber(c.roas, 0) > 0)
  if (valid.length === 0) return 0
  const sum = valid.reduce((acc, c) => acc + toNumber(c.roas, 0), 0)
  return sum / valid.length
}

// Métricas derivadas de un registro diario.
export function computeEntryMetrics(entry, settings) {
  const adSpend = toNumber(entry.adSpend, 0)
  const sales = toNumber(entry.sales, 0)
  const purchases = toNumber(entry.purchases, 0)
  const feePct = toNumber(settings?.processorFeePct, 0)

  const processorCost = sales * (feePct / 100)

  const fixedMonthly = sumFixedCosts(settings?.fixedCosts)
  const dailyFixed = fixedMonthly > 0 ? fixedMonthly / daysInMonthOf(entry.date) : 0

  const profit = sales - processorCost - adSpend - dailyFixed

  const cpa = purchases > 0 ? adSpend / purchases : 0
  const aov = purchases > 0 ? sales / purchases : 0 // ticket promedio
  const profitPct = sales > 0 ? (profit / sales) * 100 : 0
  const roasReal = adSpend > 0 ? sales / adSpend : 0 // ROAS global del día
  const roasCampaigns = avgCampaignRoas(entry.campaigns)

  return {
    adSpend,
    sales,
    purchases,
    processorCost,
    dailyFixed,
    profit,
    cpa,
    aov,
    profitPct,
    roasReal,
    roasCampaigns,
  }
}

export function sumFixedCosts(fixedCosts = []) {
  return fixedCosts.reduce((acc, c) => acc + toNumber(c.amount, 0), 0)
}

// Agrupa registros por mes y devuelve totales + promedios + serie diaria.
export function buildMonthlySummaries(entries, settings) {
  const groups = new Map()

  for (const entry of entries) {
    const key = monthKey(entry.date)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(entry)
  }

  const summaries = []
  for (const [key, monthEntries] of groups) {
    const sorted = [...monthEntries].sort((a, b) => a.date.localeCompare(b.date))

    const totals = {
      adSpend: 0,
      sales: 0,
      purchases: 0,
      processorCost: 0,
      profit: 0,
    }
    const daily = []

    for (const entry of sorted) {
      const m = computeEntryMetrics(entry, settings)
      totals.adSpend += m.adSpend
      totals.sales += m.sales
      totals.purchases += m.purchases
      totals.processorCost += m.processorCost
      totals.profit += m.profit
      daily.push({
        date: entry.date,
        day: entry.date.slice(8, 10),
        adSpend: round(m.adSpend, 2),
        sales: round(m.sales, 2),
        profit: round(m.profit, 2),
        roas: round(m.roasReal, 2),
      })
    }

    // Costos fijos del mes (no prorrateados): total tal cual para mostrar.
    const fixedMonthly = sumFixedCosts(settings?.fixedCosts)
    // El profit total ya tiene prorrateado lo fijo por día cargado; para que el
    // resumen sea coherente, restamos lo fijo no cubierto por días sin carga.
    const daysLoaded = sorted.length
    const dim = daysInMonthOf(key + '-01')
    const fixedNotCovered = fixedMonthly > 0
      ? fixedMonthly * Math.max(0, (dim - daysLoaded)) / dim
      : 0

    summaries.push({
      key,
      label: monthLabel(key),
      totals: {
        ...totals,
        fixedMonthly,
        profit: totals.profit - fixedNotCovered,
      },
      averages: {
        roas: totals.adSpend > 0 ? totals.sales / totals.adSpend : 0,
        cpa: totals.purchases > 0 ? totals.adSpend / totals.purchases : 0,
        aov: totals.purchases > 0 ? totals.sales / totals.purchases : 0,
        profitPct: totals.sales > 0 ? (totals.profit / totals.sales) * 100 : 0,
      },
      daily,
      count: sorted.length,
    })
  }

  // Mes más reciente primero.
  summaries.sort((a, b) => b.key.localeCompare(a.key))
  return summaries
}

export function round(n, decimals = 0) {
  const f = Math.pow(10, decimals)
  return Math.round((toNumber(n, 0) + Number.EPSILON) * f) / f
}

// Formato de moneda para mostrar (con 2 decimales).
export function formatMoney(value, currency = 'ARS') {
  const n = toNumber(value, 0)
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `$${n.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
}

export function formatNumber(value, decimals = 2) {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(toNumber(value, 0))
}
