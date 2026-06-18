# Finanzas del negocio 📊

Mini app web para llevar el control diario de un negocio de **productos digitales** que se vende con **Facebook Ads**. Cargás cada día tu inversión, ventas y compras, y la app calcula automáticamente tu **profit real**, ROAS, CPA, ticket promedio y los acumulados del mes.

Pensada para uso personal, sin servidor ni base de datos: todo se guarda en tu navegador (localStorage) y podés descargar/importar un backup en JSON.

## Qué calcula

Por cada día:
- **Profit real** = ventas − comisión del procesador (6,6% configurable) − inversión en ads − costos fijos prorrateados
- **CPA** (costo por compra) = inversión ÷ compras
- **Ticket promedio (AOV)** = ventas ÷ compras
- **ROAS** por campaña y promedio
- **Profit %** sobre ventas

Y a nivel mensual: totales de inversión, ventas, profit, compras, comisiones y promedios, con gráficos de profit por día y ventas vs. inversión.

> **ROAS de equilibrio:** con productos digitales (sin costo de mercadería) y solo la comisión del procesador, el ROAS mínimo para no perder plata es `1 / (1 − comisión)`. Con 6,6% da ≈ **1,07**.

## Cómo se usa

- **Carga diaria:** completá fecha, inversión en FB Ads, ventas (facturación bruta), cantidad de compras y el ROAS de cada campaña (los datos salen del Ad Manager).
- **Resumen mensual:** elegí el mes y mirá totales, métricas y gráficos.
- **Ajustes:** configurá el % del procesador, costos fijos (opcional) y la moneda. Desde acá descargás o restaurás el backup JSON.

## Desarrollo

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo
npm run build    # build de producción (carpeta dist/)
npm run preview  # previsualizar el build
```

Stack: **React + Vite + Recharts**.

## Deploy en Vercel

1. Importá este repo en [Vercel](https://vercel.com/new).
2. Vercel detecta Vite automáticamente (build: `vite build`, output: `dist`). La config ya está en `vercel.json`.
3. Deploy y listo.

## Datos y privacidad

Los datos viven solo en tu navegador. Si limpiás los datos del sitio o cambiás de dispositivo, se pierden salvo que tengas un backup. **Descargá el JSON cada tanto** desde la pestaña Ajustes.
