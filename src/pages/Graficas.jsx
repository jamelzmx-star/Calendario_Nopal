import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import styles from './Graficas.module.css'

const fmt = (n) => `$${n.toLocaleString('es-MX')}`
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

export default function Graficas() {
  const { entregas } = useApp()
  const [vista, setVista] = useState('semana')

  const hoy = new Date()

  // === SEMANA ===
  const semanaData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const del_dia = entregas.filter(e => e.fecha === key)
    semanaData.push({
      dia: DIAS[d.getDay()],
      total: del_dia.reduce((s, e) => s + e.total, 0),
      cobrado: del_dia.filter(e => e.pagado).reduce((s, e) => s + e.total, 0),
      cajas: del_dia.reduce((s, e) => s + e.cajas, 0),
    })
  }

  // === MES ===
  const mesData = []
  for (let m = 5; m >= 0; m--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1)
    const y = fecha.getFullYear()
    const mo = fecha.getMonth()
    const del_mes = entregas.filter(e => {
      const [ey, em] = e.fecha.split('-').map(Number)
      return ey === y && em - 1 === mo
    })
    mesData.push({
      mes: `${MESES_CORTOS[mo]}`,
      total: del_mes.reduce((s, e) => s + e.total, 0),
      cobrado: del_mes.filter(e => e.pagado).reduce((s, e) => s + e.total, 0),
      cajas: del_mes.reduce((s, e) => s + e.cajas, 0),
    })
  }

  const data = vista === 'semana' ? semanaData : mesData
  const labelKey = vista === 'semana' ? 'dia' : 'mes'

  const totalPeriodo = data.reduce((s, d) => s + d.total, 0)
  const cobradoPeriodo = data.reduce((s, d) => s + d.cobrado, 0)
  const cajasPeriodo = data.reduce((s, d) => s + d.cajas, 0)
  const mejorDia = data.reduce((max, d) => d.total > max.total ? d : max, data[0] || {})

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipLabel}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color }} className={styles.tooltipItem}>
              {p.name}: {fmt(p.value)}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.titulo}>📊 Ganancias</h1>
      </div>

      {/* Toggle vista */}
      <div className={styles.toggle}>
        <button
          className={`${styles.toggleBtn} ${vista === 'semana' ? styles.toggleActivo : ''}`}
          onClick={() => setVista('semana')}
        >Semana</button>
        <button
          className={`${styles.toggleBtn} ${vista === 'mes' ? styles.toggleActivo : ''}`}
          onClick={() => setVista('mes')}
        >6 meses</button>
      </div>

      {/* Stats rápidos */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total facturado</div>
          <div className={styles.statValor}>{fmt(totalPeriodo)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Cobrado</div>
          <div className={`${styles.statValor} ${styles.verde}`}>{fmt(cobradoPeriodo)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Cajas</div>
          <div className={styles.statValor}>{cajasPeriodo}</div>
        </div>
      </div>

      {/* Gráfica de barras */}
      <div className={styles.graficaCard}>
        <h2 className={styles.graficaTitulo}>💰 Total facturado</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" />
            <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: '#7a5c3e' }} />
            <YAxis tick={{ fontSize: 10, fill: '#7a5c3e' }}
              tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" name="Total" fill="#4a9e2f" radius={[6,6,0,0]} />
            <Bar dataKey="cobrado" name="Cobrado" fill="#2d6a18" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica de líneas - cajas */}
      <div className={styles.graficaCard}>
        <h2 className={styles.graficaTitulo}>📦 Cajas entregadas</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" />
            <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: '#7a5c3e' }} />
            <YAxis tick={{ fontSize: 10, fill: '#7a5c3e' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="cajas"
              name="Cajas"
              stroke="#c4622d"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#c4622d' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detalle por día */}
      <div className={styles.detalleCard}>
        <h2 className={styles.graficaTitulo}>📋 Desglose</h2>
        {data.map((d, i) => (
          d.total > 0 && (
            <div key={i} className={styles.detalleRow}>
              <span className={styles.detalleLabel}>{d[labelKey]}</span>
              <div className={styles.detalleBar}>
                <div
                  className={styles.detalleFill}
                  style={{ width: `${totalPeriodo > 0 ? (d.total / totalPeriodo) * 100 : 0}%` }}
                />
              </div>
              <span className={styles.detalleValor}>{fmt(d.total)}</span>
            </div>
          )
        ))}
        {totalPeriodo === 0 && (
          <p className={styles.sinDatos}>Sin datos en este período</p>
        )}
        <div className={styles.detalleTotalRow}>
          <span className={styles.detalleTotalLabel}>Total del período</span>
          <span className={styles.detalleTotalValor}>{fmt(totalPeriodo)}</span>
        </div>
      </div>
    </div>
  )
}
