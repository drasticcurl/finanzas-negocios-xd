import { useEffect, useMemo, useState } from 'react'
import EntryForm from './components/EntryForm.jsx'
import DailyTable from './components/DailyTable.jsx'
import Dashboard from './components/Dashboard.jsx'
import Settings from './components/Settings.jsx'
import {
  loadState,
  saveState,
  exportToJson,
  importFromJsonFile,
  normalizeState,
} from './lib/storage.js'
import {
  computeEntryMetrics,
  buildMonthlySummaries,
  formatMoney,
} from './lib/calculations.js'

const TABS = [
  { id: 'carga', label: 'Carga diaria' },
  { id: 'resumen', label: 'Resumen mensual' },
  { id: 'ajustes', label: 'Ajustes' },
]

export default function App() {
  const [state, setState] = useState(() => loadState())
  const [tab, setTab] = useState('carga')
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  // Resumen del mes en curso para la cabecera.
  const headerStat = useMemo(() => {
    const summaries = buildMonthlySummaries(state.entries, state.settings)
    if (summaries.length === 0) return null
    return summaries[0]
  }, [state.entries, state.settings])

  function upsertEntry(entry) {
    setState((s) => {
      const exists = s.entries.some((e) => e.id === entry.id)
      const entries = exists
        ? s.entries.map((e) => (e.id === entry.id ? entry : e))
        : [...s.entries, entry]
      return { ...s, entries }
    })
    setEditing(null)
  }

  function deleteEntry(id) {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }))
    if (editing?.id === id) setEditing(null)
  }

  function startEdit(entry) {
    setEditing(entry)
    setTab('carga')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateSettings(settings) {
    setState((s) => ({ ...s, settings }))
  }

  function handleExport() {
    exportToJson(state)
  }

  async function handleImport(file) {
    try {
      const imported = await importFromJsonFile(file)
      if (
        confirm(
          `Vas a reemplazar los datos actuales por el backup (${imported.entries.length} registros). ¿Continuar?`,
        )
      ) {
        setState(imported)
        alert('Backup importado correctamente.')
      }
    } catch (err) {
      alert('Error al importar: ' + err.message)
    }
  }

  function handleReset() {
    if (confirm('Esto borra TODOS los registros y ajustes de este navegador. ¿Seguro?')) {
      setState(normalizeState(null))
      setEditing(null)
    }
  }

  const currency = state.settings?.currency || 'ARS'

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="logo">📊</div>
          <div>
            <h1>Finanzas del negocio</h1>
            <p className="muted">Productos digitales · Facebook Ads</p>
          </div>
        </div>
        {headerStat && (
          <div className="header-stat">
            <span className="muted">Profit · {headerStat.label}</span>
            <strong className={headerStat.totals.profit >= 0 ? 'pos' : 'neg'}>
              {formatMoney(headerStat.totals.profit, currency)}
            </strong>
          </div>
        )}
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'tab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'carga' && (
          <>
            <EntryForm
              editing={editing}
              onSave={upsertEntry}
              onCancelEdit={() => setEditing(null)}
            />
            <DailyTable
              entries={state.entries}
              settings={state.settings}
              onEdit={startEdit}
              onDelete={deleteEntry}
            />
          </>
        )}

        {tab === 'resumen' && (
          <Dashboard entries={state.entries} settings={state.settings} />
        )}

        {tab === 'ajustes' && (
          <Settings
            settings={state.settings}
            onChange={updateSettings}
            onExport={handleExport}
            onImport={handleImport}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="app-footer">
        <span className="muted">
          Datos guardados en este navegador · Recordá descargar un backup cada tanto
        </span>
      </footer>
    </div>
  )
}
