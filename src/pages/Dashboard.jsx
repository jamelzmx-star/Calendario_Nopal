import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import BackupPanel from '../components/BackupPanel'
import styles from './Dashboard.module.css'

const fmt  = (n) => `$${n.toLocaleString('es-MX')}`
const fmtF = (s) => { const [,m,d]=s.split('-'); return `${d} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1]}` }
const diasRest = (fin) => fin ? Math.ceil((new Date(fin)-new Date())/86400000) : null

// Genera recordatorios para HOY:
// A partir del día seleccionado (1, 3 ó 7) se dispara TODOS LOS DÍAS siguientes
// hasta que se pague. Solo muestra los de hoy.
const getRecordatoriosHoy = (entregas) => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const result = []
  entregas.filter(e => !e.pagado).forEach(e => {
    const inicio = new Date(e.fecha + 'T12:00:00')
    const diasDesdeEntrega = Math.floor((hoy - inicio) / 86400000)
    const rec = e.recordatorio || 3

    // El primer recordatorio es en el día `rec`, luego cada día después de eso
    // diasDesdeEntrega >= rec significa que ya pasó el umbral
    if (diasDesdeEntrega >= rec) {
      result.push({
        id:      e.id,
        cliente: e.cliente,
        total:   e.total,
        cajas:   (e.categorias || []).reduce((s, c) => s + (Number(c.cajas) || 0), 0),
        dias:    diasDesdeEntrega,
        fecha:   e.fecha,
      })
    }
  })

  // Ordenar por más urgente (más días sin cobrar primero)
  return result.sort((a, b) => b.dias - a.dias)
}

export default function Dashboard() {
  const { entregas, totales } = useApp()
  const { profile, logout, isAdmin } = useAuth()
  const nav = useNavigate()
  const [backup,   setBackup]   = useState(false)
  const [menu,     setMenu]     = useState(false)
  const [notifIdx, setNotifIdx] = useState(0)  // índice del carrusel
  const [notifAbierto, setNotifAbierto] = useState(false)
  const [dismissedKey] = useState(() => {
    const hoy = new Date().toISOString().split('T')[0]
    return `nopal-notif-dismissed-${hoy}`
  })

  const ultimas = entregas.slice(0, 4)
  const dias    = diasRest(profile?.suscripcion_fin)
  const alerta  = dias !== null && dias <= 7
  const recs    = getRecordatoriosHoy(entregas)

  // Mostrar notificación al entrar solo si hay recordatorios y no se descartó hoy
  useEffect(() => {
    if (recs.length > 0 && !sessionStorage.getItem(dismissedKey)) {
      const t = setTimeout(() => setNotifAbierto(true), 700)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line

  const cerrarNotif = useCallback(() => {
    setNotifAbierto(false)
    // Marcar como visto para esta sesión
    sessionStorage.setItem(dismissedKey, '1')
  }, [dismissedKey])

  const prev = () => setNotifIdx(i => (i - 1 + recs.length) % recs.length)
  const next = () => setNotifIdx(i => (i + 1) % recs.length)

  const recActual = recs[notifIdx]

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoRow}>
          <div className={styles.logo}>🌵</div>
          <div>
            <h1 className={styles.titulo}>Control Nopal</h1>
            <p className={styles.sub}>{profile?.nombre || profile?.email?.split('@')[0] || 'Usuario'}</p>
          </div>
        </div>
        <div className={styles.menuWrap}>
          <button className={styles.menuBtn} onClick={() => setMenu(v => !v)}>⋯</button>
          {menu && (
            <div className={styles.drop}>
              <button className={styles.dropItem} onClick={() => { setBackup(true); setMenu(false) }}>💾 Respaldo</button>
              {isAdmin && <button className={styles.dropItem} onClick={() => nav('/admin')}>⚙️ Panel Admin</button>}
              <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={() => logout()}>🚪 Cerrar sesión</button>
            </div>
          )}
          {menu && <div className={styles.backdrop} onClick={() => setMenu(false)} />}
        </div>
      </div>

      {/* Alerta suscripción */}
      {alerta && (
        <div className={`${styles.subAlert} ${dias <= 0 ? styles.subVenc : ''}`}>
          {dias <= 0
            ? '❌ Suscripción vencida. Contacta al administrador.'
            : `⚠️ Tu suscripción vence en ${dias} día${dias !== 1 ? 's' : ''}. Contacta para renovar.`}
        </div>
      )}

      {/* Cards dinero */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.cPend}`}>
          <span className={styles.cIcon}>💰</span>
          <div>
            <div className={styles.cLbl}>Por cobrar</div>
            <div className={styles.cVal}>{fmt(totales.pendiente)}</div>
          </div>
        </div>
        <div className={`${styles.card} ${styles.cCob}`}>
          <span className={styles.cIcon}>✅</span>
          <div>
            <div className={styles.cLbl}>Cobrado</div>
            <div className={styles.cVal}>{fmt(totales.cobrado)}</div>
          </div>
        </div>
      </div>

      {/* Cards cajas */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.cCajPend}`}>
          <span className={styles.cIcon}>📦</span>
          <div>
            <div className={styles.cLbl}>Cajas entregadas</div>
            <div className={styles.cVal}>{totales.cajasPendiente}</div>
          </div>
        </div>
        <div className={`${styles.card} ${styles.cCajCob}`}>
          <span className={styles.cIcon}>📫</span>
          <div>
            <div className={styles.cLbl}>Cajas cobradas</div>
            <div className={styles.cVal}>{totales.cajasCobradas}</div>
          </div>
        </div>
      </div>

      <button className={styles.btnNueva} onClick={() => nav('/nueva')}>➕ Nueva entrega</button>

      {/* Últimas entregas */}
      <div className={styles.sec}>
        <div className={styles.secH}>
          <h2 className={styles.secT}>📋 Últimas entregas</h2>
          <button className={styles.verTodas} onClick={() => nav('/entregas')}>Ver todas →</button>
        </div>
        <div className={styles.lista}>
          {ultimas.length === 0 && (
            <div className={styles.vacio}><span>📭</span><p>Aún no hay entregas. ¡Registra la primera!</p></div>
          )}
          {ultimas.map((e, i) => (
            <div key={e.id} className={styles.item} style={{ animationDelay:`${i*.07}s` }}
              onClick={() => nav(`/editar/${e.id}`)}>
              <div className={styles.itemF}>{fmtF(e.fecha)}</div>
              <div className={styles.itemI}>
                <span className={styles.itemC}>{e.cliente.split(' ')[0]}</span>
                <span className={styles.itemD}>
                  {(e.categorias||[]).reduce((s,c) => s+(Number(c.cajas)||0), 0)} cajas · {fmt(e.total)}
                </span>
              </div>
              <span className={e.pagado ? 'badge-pagado' : 'badge-pendiente'}>
                {e.pagado ? '✅' : '❌'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className={styles.accesos}>
        <button className={styles.acc} onClick={() => { setNotifIdx(0); setNotifAbierto(true) }}>
          <span>🔔</span>
          <span>Cobros{recs.length > 0 ? ` (${recs.length})` : ''}</span>
        </button>
        <button className={styles.acc} onClick={() => nav('/graficas')}><span>📊</span><span>Gráficas</span></button>
        <button className={styles.acc} onClick={() => setBackup(true)}><span>💾</span><span>Respaldo</span></button>
      </div>

      {/* ── Modal carrusel de recordatorios ── */}
      {notifAbierto && (
        <div className={styles.notifOv} onClick={cerrarNotif}>
          <div className={styles.notifPanel} onClick={e => e.stopPropagation()}>

            <div className={styles.notifHdr}>
              <span>🔔</span>
              <h2 className={styles.notifTit}>
                {recs.length === 0 ? 'Sin cobros pendientes' : `Cobros pendientes${recs.length > 1 ? ` (${notifIdx + 1}/${recs.length})` : ''}`}
              </h2>
              <button className={styles.notifCls} onClick={cerrarNotif}>✕</button>
            </div>

            {recs.length === 0 ? (
              <div className={styles.notifVacio}>
                <span>🎉</span>
                <p>¡Todo al corriente!</p>
              </div>
            ) : (
              <>
                {/* Tarjeta actual */}
                <div className={styles.notifCard}
                  onClick={() => { cerrarNotif(); nav(`/editar/${recActual.id}`) }}>
                  <div className={styles.notifDias}>
                    ⏰ {recActual.dias} día{recActual.dias !== 1 ? 's' : ''} sin cobrar
                  </div>
                  <div className={styles.notifCliente}>👤 {recActual.cliente}</div>
                  <div className={styles.notifMonto}>{fmt(recActual.total)}</div>
                  <div className={styles.notifCajas}>📦 {recActual.cajas} cajas · {fmtF(recActual.fecha)}</div>
                  <div className={styles.notifTap}>Toca para ir a la entrega →</div>
                </div>

                {/* Controles carrusel */}
                {recs.length > 1 && (
                  <div className={styles.carrusel}>
                    <button className={styles.carBtn} onClick={prev}>‹</button>
                    <div className={styles.carDots}>
                      {recs.map((_, i) => (
                        <button
                          key={i}
                          className={`${styles.dot} ${i === notifIdx ? styles.dotOn : ''}`}
                          onClick={() => setNotifIdx(i)}
                        />
                      ))}
                    </div>
                    <button className={styles.carBtn} onClick={next}>›</button>
                  </div>
                )}
              </>
            )}

            <button className={styles.notifBtn} onClick={cerrarNotif}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {backup && <BackupPanel onClose={() => setBackup(false)} />}
    </div>
  )
}
