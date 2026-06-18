// Persistencia en localStorage + export/import de backups en JSON.

const STORAGE_KEY = 'finanzas-negocios-xd:v1'

export const DEFAULT_SETTINGS = {
  // % que cobra el procesador de pagos sobre cada venta (costo variable principal).
  processorFeePct: 6.6,
  // Costos fijos mensuales. Apartado preparado para el futuro; arranca vacío.
  // Cada costo: { id, name, amount }
  fixedCosts: [],
  // Moneda usada solo para mostrar.
  currency: 'ARS',
}

function makeDefaultState() {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    // entries: registros diarios.
    // { id, date, adSpend, sales, purchases, campaigns: [{id,name,roas}], notes }
    entries: [],
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return makeDefaultState()
    const parsed = JSON.parse(raw)
    return normalizeState(parsed)
  } catch (err) {
    console.error('No se pudo leer el almacenamiento local:', err)
    return makeDefaultState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('No se pudo guardar en el almacenamiento local:', err)
  }
}

// Asegura que un objeto importado/cargado tenga la forma esperada.
export function normalizeState(input) {
  const base = makeDefaultState()
  if (!input || typeof input !== 'object') return base

  const settings = {
    ...base.settings,
    ...(input.settings || {}),
  }
  settings.processorFeePct = toNumber(settings.processorFeePct, DEFAULT_SETTINGS.processorFeePct)
  settings.fixedCosts = Array.isArray(settings.fixedCosts)
    ? settings.fixedCosts
        .map((c) => ({
          id: c.id || cryptoId(),
          name: String(c.name ?? ''),
          amount: toNumber(c.amount, 0),
        }))
    : []
  settings.currency = settings.currency || 'ARS'

  const entries = Array.isArray(input.entries)
    ? input.entries.map(normalizeEntry).filter(Boolean)
    : []

  return { version: 1, settings, entries }
}

function normalizeEntry(e) {
  if (!e || typeof e !== 'object') return null
  return {
    id: e.id || cryptoId(),
    date: typeof e.date === 'string' ? e.date : '',
    adSpend: toNumber(e.adSpend, 0),
    sales: toNumber(e.sales, 0),
    purchases: toNumber(e.purchases, 0),
    campaigns: Array.isArray(e.campaigns)
      ? e.campaigns.map((c) => ({
          id: c.id || cryptoId(),
          name: String(c.name ?? ''),
          roas: toNumber(c.roas, 0),
        }))
      : [],
    notes: typeof e.notes === 'string' ? e.notes : '',
  }
}

export function toNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function cryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// --- Backup ---

export function exportToJson(state) {
  const payload = {
    app: 'finanzas-negocios-xd',
    exportedAt: new Date().toISOString(),
    ...state,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `finanzas-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importFromJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        resolve(normalizeState(parsed))
      } catch (err) {
        reject(new Error('El archivo no es un JSON válido.'))
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsText(file)
  })
}
