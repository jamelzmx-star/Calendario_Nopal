import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import styles from './Notificaciones.module.css'

const fmt = (n) => `$${n.toLocaleString('es-MX')}`

const addDays = (dateStr, days) => {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d
}

const fmtFechaCompleta = (d) => {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`
}

export default function Notificaciones() {
  const { entregas } = useApp()
  const nav = useNavigate()

  // Generar recordatorios para entregas pendientes
  const recordatorios = []
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  entregas
    .filter(e => !e.pagado)
    .forEach(e => {
      const rec = e.recordatorio || 3
      // Generar hasta 3 recordatorios escalonados
      for (let i = 1; i <= 3; i++) {
        const fechaRec = addDays(e.fecha, rec * i)
        recordatorios.push({
          id: `${e.id}-${i}`,
          fecha: fechaRec,
          cliente: e.cliente,
          total: e.total,
          num: i,
          entregaId: e.id,
          vencido: fechaRec < hoy,
        })
      }
    })

  // Ordenar por fecha
  recordatorios.sort((a, b) => a.fecha - b.fecha)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => nav(-1)}>←</button>
        <h1 className={styles.titulo}>🔔 Recordatorios</h1>
        <span />
      </div>

      {recordatorios.length === 0 ? (
        <div className={styles.vacio}>
          <span>🎉</span>
          <p>¡Sin cobros pendientes!</p>
          <small>Todas las entregas están pagadas</small>
        </div>
      ) : (
        <div className={styles.lista}>
          {recordatorios.map((r, i) => (
            <div
              key={r.id}
              className={`${styles.item} ${r.vencido ? styles.vencido : styles.futuro}`}
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => nav(`/editar/${r.entregaId}`)}
            >
              <div className={styles.itemFecha}>
                <span className={styles.itemFechaText}>{fmtFechaCompleta(r.fecha)}</span>
                {r.vencido && <span className={styles.tagVencido}>Vencido</span>}
              </div>
              <div className={styles.itemInfo}>
                <span className={styles.itemMonto}>💰 Cobrar {fmt(r.total)}</span>
                <span className={styles.itemCliente}>👤 {r.cliente}</span>
              </div>
              <div className={styles.itemTag}>
                <span>⏰ Recordatorio {r.num}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.info}>
        <span>💡</span>
        <p>Los recordatorios se generan automáticamente según la configuración de cada entrega.</p>
      </div>
    </div>
  )
}
