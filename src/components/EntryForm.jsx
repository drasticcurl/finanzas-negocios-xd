import { useState, useEffect } from 'react'
import { cryptoId } from '../lib/storage.js'
import { avgCampaignRoas, formatNumber } from '../lib/calculations.js'

function todayStr() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

function emptyDraft() {
  return {
    id: null,
    date: todayStr(),
    adSpend: '',
    sales: '',
    purchases: '',
    campaigns: [{ id: cryptoId(), name: '', roas: '' }],
    notes: '',
  }
}

export default function EntryForm({ editing, onSave, onCancelEdit }) {
  const [draft, setDraft] = useState(emptyDraft())

  useEffect(() => {
    if (editing) {
      setDraft({
        ...editing,
        adSpend: String(editing.adSpend ?? ''),
        sales: String(editing.sales ?? ''),
        purchases: String(editing.purchases ?? ''),
        campaigns:
          editing.campaigns && editing.campaigns.length
            ? editing.campaigns.map((c) => ({
                id: c.id || cryptoId(),
                name: c.name ?? '',
                roas: String(c.roas ?? ''),
              }))
            : [{ id: cryptoId(), name: '', roas: '' }],
      })
    }
  }, [editing])

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function setCampaign(id, field, value) {
    setDraft((d) => ({
      ...d,
      campaigns: d.campaigns.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }))
  }

  function addCampaign() {
    setDraft((d) => ({
      ...d,
      campaigns: [...d.campaigns, { id: cryptoId(), name: '', roas: '' }],
    }))
  }

  function removeCampaign(id) {
    setDraft((d) => ({
      ...d,
      campaigns:
        d.campaigns.length > 1 ? d.campaigns.filter((c) => c.id !== id) : d.campaigns,
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!draft.date) {
      alert('Elegí una fecha.')
      return
    }
    const cleaned = {
      id: draft.id || cryptoId(),
      date: draft.date,
      adSpend: draft.adSpend,
      sales: draft.sales,
      purchases: draft.purchases,
      campaigns: draft.campaigns
        .filter((c) => c.name.trim() !== '' || String(c.roas).trim() !== '')
        .map((c) => ({ id: c.id, name: c.name.trim(), roas: c.roas })),
      notes: draft.notes,
    }
    onSave(cleaned)
    if (!editing) setDraft(emptyDraft())
  }

  function handleCancel() {
    setDraft(emptyDraft())
    onCancelEdit?.()
  }

  const liveRoas = avgCampaignRoas(
    draft.campaigns.map((c) => ({ roas: Number(String(c.roas).replace(',', '.')) || 0 })),
  )

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-head">
        <h2>{editing ? 'Editar registro' : 'Cargar día'}</h2>
        {editing && (
          <span className="badge badge-edit">Editando {editing.date}</span>
        )}
      </div>

      <div className="grid">
        <label className="field">
          <span>Fecha</span>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Inversión FB Ads</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            placeholder="0"
            value={draft.adSpend}
            onChange={(e) => set('adSpend', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Ventas (bruto)</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            placeholder="0"
            value={draft.sales}
            onChange={(e) => set('sales', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Cantidad de compras</span>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            placeholder="0"
            value={draft.purchases}
            onChange={(e) => set('purchases', e.target.value)}
          />
        </label>
      </div>

      <div className="campaigns">
        <div className="campaigns-head">
          <span>ROAS por campaña</span>
          <small>
            Promedio:&nbsp;
            <strong>{liveRoas > 0 ? formatNumber(liveRoas, 2) : '—'}</strong>
          </small>
        </div>

        {draft.campaigns.map((c, i) => (
          <div className="campaign-row" key={c.id}>
            <input
              type="text"
              placeholder={`Campaña ${i + 1}`}
              value={c.name}
              onChange={(e) => setCampaign(c.id, 'name', e.target.value)}
            />
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="ROAS (ej: 2.5)"
              value={c.roas}
              onChange={(e) => setCampaign(c.id, 'roas', e.target.value)}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => removeCampaign(c.id)}
              aria-label="Quitar campaña"
              disabled={draft.campaigns.length <= 1}
            >
              ✕
            </button>
          </div>
        ))}

        <button type="button" className="btn btn-ghost btn-sm" onClick={addCampaign}>
          + Agregar campaña
        </button>
      </div>

      <label className="field">
        <span>Notas (opcional)</span>
        <input
          type="text"
          placeholder="Algo para recordar de este día..."
          value={draft.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {editing ? 'Guardar cambios' : 'Agregar registro'}
        </button>
        {editing && (
          <button type="button" className="btn btn-ghost" onClick={handleCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
