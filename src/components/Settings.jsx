import { useRef } from 'react'
import { cryptoId } from '../lib/storage.js'
import {
  breakEvenRoas,
  formatNumber,
  sumFixedCosts,
  formatMoney,
} from '../lib/calculations.js'

export default function Settings({ settings, onChange, onExport, onImport, onReset }) {
  const fileRef = useRef(null)
  const currency = settings?.currency || 'ARS'

  function setFee(value) {
    onChange({ ...settings, processorFeePct: value })
  }

  function setCurrency(value) {
    onChange({ ...settings, currency: value })
  }

  function addFixedCost() {
    onChange({
      ...settings,
      fixedCosts: [...settings.fixedCosts, { id: cryptoId(), name: '', amount: '' }],
    })
  }

  function updateFixedCost(id, field, value) {
    onChange({
      ...settings,
      fixedCosts: settings.fixedCosts.map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    })
  }

  function removeFixedCost(id) {
    onChange({
      ...settings,
      fixedCosts: settings.fixedCosts.filter((c) => c.id !== id),
    })
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (file) onImport(file)
    e.target.value = ''
  }

  const beRoas = breakEvenRoas(settings?.processorFeePct)
  const fixedTotal = sumFixedCosts(settings?.fixedCosts)

  return (
    <div className="settings">
      <div className="card">
        <h2>Ajustes del negocio</h2>

        <div className="grid">
          <label className="field">
            <span>Comisión del procesador de pagos (%)</span>
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              value={settings.processorFeePct}
              onChange={(e) => setFee(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Moneda</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="ARS">ARS · Peso argentino</option>
              <option value="USD">USD · Dólar</option>
              <option value="EUR">EUR · Euro</option>
            </select>
          </label>
        </div>

        <p className="hint">
          Con una comisión del <strong>{formatNumber(settings.processorFeePct, 2)}%</strong> y sin
          costo de producto, tu <strong>ROAS de equilibrio</strong> es{' '}
          <strong>{formatNumber(beRoas, 2)}</strong>. Por debajo de ese ROAS, cada venta pierde
          plata aunque el ROAS sea mayor a 1.
        </p>
      </div>

      <div className="card">
        <div className="table-head">
          <h2>Costos fijos mensuales</h2>
          <small className="muted">
            Total: <strong>{formatMoney(fixedTotal, currency)}</strong>/mes
          </small>
        </div>
        <p className="hint">
          Apartado opcional. Si cargás costos fijos (suscripciones, herramientas, etc.), se
          prorratean por día y se descuentan del profit. Dejalo vacío si por ahora no tenés.
        </p>

        {settings.fixedCosts.length === 0 && (
          <p className="muted">Sin costos fijos cargados.</p>
        )}

        {settings.fixedCosts.map((c) => (
          <div className="campaign-row" key={c.id}>
            <input
              type="text"
              placeholder="Nombre (ej: Shopify, Canva...)"
              value={c.name}
              onChange={(e) => updateFixedCost(c.id, 'name', e.target.value)}
            />
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Monto / mes"
              value={c.amount}
              onChange={(e) => updateFixedCost(c.id, 'amount', e.target.value)}
            />
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => removeFixedCost(c.id)}
              aria-label="Quitar costo fijo"
            >
              ✕
            </button>
          </div>
        ))}

        <button type="button" className="btn btn-ghost btn-sm" onClick={addFixedCost}>
          + Agregar costo fijo
        </button>
      </div>

      <div className="card">
        <h2>Copia de seguridad</h2>
        <p className="hint">
          Tus datos se guardan en este navegador. Descargá un backup en JSON cada tanto por las
          dudas, y restauralo cuando quieras o en otra compu.
        </p>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={onExport}>
            ⬇ Descargar backup (JSON)
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            ⬆ Importar backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>
        <div className="danger-zone">
          <button className="btn btn-danger btn-sm" onClick={onReset}>
            Borrar todos los datos
          </button>
        </div>
      </div>
    </div>
  )
}
