import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Calendario.module.css'

const fmt = (n) => `$${n.toLocaleString('es-MX')}`
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_HEADER = ['L','M','M','J','V','S','D']

export default function Calendario() {
  const { entregas } = useApp()
  const nav = useNavigate()
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [diaSelec, setDiaSelec] = useState(null)

  // Calcular días del mes
  const primerDia = new Date(anio, mes, 1)
  const totalDias = new Date(anio, mes + 1, 0).getDate()
  // Lunes=0, offset
  let offset = primerDia.getDay() - 1
  if (offset < 0) offset = 6

  const celdas = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= totalDias; d++) celdas.push(d)

  // Entregas por día
  const porDia = {}
  entregas.forEach(e => {
    const [y, m, d] = e.fecha.split('-').map(Number)
    if (y === anio && m - 1 === mes) {
      if (!porDia[d]) porDia[d] = []
      porDia[d].push(e)
    }
  })

  const mesStr = (m) => String(m + 1).padStart(2, '0')
  const fechaStr = (d) => `${anio}-${mesStr(mes)}-${String(d).padStart(2, '0')}`

  const navMes = (dir) => {
    setDiaSelec(null)
    const nuevo = new Date(anio, mes + dir, 1)
    setMes(nuevo.getMonth())
    setAnio(nuevo.getFullYear())
  }

  const detalleDia = diaSelec ? porDia[diaSelec] || [] : []
  const totalDiaCalc = detalleDia.reduce((s, e) => ({
    cajas: s.cajas + e.cajas, monto: s.monto + e.total
  }), { cajas: 0, monto: 0 })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.titulo}>📅 Calendario</h1>
      </div>

      {/* Navegador de mes */}
      <div className={styles.navMes}>
        <button className={styles.navBtn} onClick={() => navMes(-1)}>‹</button>
        <span className={styles.mesLabel}>{MESES[mes]} {anio}</span>
        <button className={styles.navBtn} onClick={() => navMes(1)}>›</button>
      </div>

      {/* Días de la semana */}
      <div className={styles.semana}>
        {DIAS_HEADER.map((d, i) => (
          <div key={i} className={styles.diaHeader}>{d}</div>
        ))}
      </div>

      {/* Grid calendario */}
      <div className={styles.grid}>
        {celdas.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className={styles.celdaVacia} />
          const tieneEntregas = porDia[d]?.length > 0
          const tienePendiente = porDia[d]?.some(e => !e.pagado)
          const esHoy = d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
          const seleccionado = d === diaSelec

          return (
            <button
              key={d}
              className={`${styles.celda} ${esHoy ? styles.hoy : ''} ${seleccionado ? styles.selec : ''} ${tieneEntregas ? styles.conEntregas : ''}`}
              onClick={() => setDiaSelec(d === diaSelec ? null : d)}
            >
              <span className={styles.numDia}>{d}</span>
              {tieneEntregas && (
                <span className={`${styles.punto} ${tienePendiente ? styles.puntoPendiente : styles.puntoPagado}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Detalle del día */}
      {diaSelec && (
        <div className={styles.detalle}>
          <div className={styles.detalleHeader}>
            <h2 className={styles.detalleTitulo}>📅 {diaSelec} de {MESES[mes]}</h2>
            {detalleDia.length > 0 && (
              <div className={styles.detalleSummary}>
                <span>📦 {totalDiaCalc.cajas} cajas</span>
                <span>💰 {fmt(totalDiaCalc.monto)}</span>
              </div>
            )}
          </div>

          {detalleDia.length === 0 ? (
            <p className={styles.sinEntregas}>Sin entregas este día</p>
          ) : (
            <div className={styles.detalleList}>
              {detalleDia.map(e => (
                <div key={e.id} className={styles.detalleItem} onClick={() => nav(`/editar/${e.id}`)}>
                  <div className={styles.detalleCliente}>👤 {e.cliente}</div>
                  <div className={styles.detalleInfo}>
                    <span>📦 {e.cajas} cajas · {fmt(e.total)}</span>
                    <span className={e.pagado ? 'badge-pagado' : 'badge-pendiente'}>
                      {e.pagado ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className={styles.btnAgregar}
            onClick={() => nav('/nueva', { state: { fecha: fechaStr(diaSelec) } })}>
            ➕ Agregar entrega
          </button>
        </div>
      )}
    </div>
  )
}
