import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import BackupPanel from '../components/BackupPanel'
import styles from './Dashboard.module.css'

const fmt  = (n) => `$${n.toLocaleString('es-MX')}`
const fmtF = (s) => { const [,m,d]=s.split('-'); return `${d} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1]}` }
const diasRest = (fin) => fin ? Math.ceil((new Date(fin)-new Date())/86400000) : null

// Genera los recordatorios pendientes para mostrar al entrar
const getRecordatorios = (entregas) => {
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const manana = new Date(hoy); manana.setDate(hoy.getDate()+1)
  const resultado = []
  entregas.filter(e => !e.pagado).forEach(e => {
    const rec = e.recordatorio || 3
    for (let i = 1; i <= 3; i++) {
      const f = new Date(e.fecha+'T12:00:00')
      f.setDate(f.getDate() + rec * i)
      // Solo los de hoy y mañana
      if (f >= hoy && f < new Date(manana.getTime() + 86400000)) {
        resultado.push({ id:`${e.id}-${i}`, cliente: e.cliente, total: e.total, fecha: f, eid: e.id })
      }
    }
  })
  return resultado
}

export default function Dashboard() {
  const { entregas, totales } = useApp()
  const { profile, logout, isAdmin } = useAuth()
  const nav = useNavigate()
  const [backup, setBackup] = useState(false)
  const [menu,   setMenu]   = useState(false)
  const [notif,  setNotif]  = useState(false)

  const ultimas = entregas.slice(0, 4)
  const dias    = diasRest(profile?.suscripcion_fin)
  const alerta  = dias !== null && dias <= 7
  const recordatoriosHoy = getRecordatorios(entregas)

  // Mostrar notificación automáticamente al entrar si hay recordatorios
  useEffect(() => {
    if (recordatoriosHoy.length > 0) {
      const timer = setTimeout(() => setNotif(true), 600)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line

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

      {/* Cards — dinero */}
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

      {/* Cards — cajas separadas */}
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

      {/* Botón nueva entrega */}
      <button className={styles.btnNueva} onClick={() => nav('/nueva')}>➕ Nueva entrega</button>

      {/* Últimas entregas */}
      <div className={styles.sec}>
        <div className={styles.secH}>
          <h2 className={styles.secT}>📋 Últimas entregas</h2>
          <button className={styles.verTodas} onClick={() => nav('/entregas')}>Ver todas →</button>
        </div>
        <div className={styles.lista}>
          {ultimas.length === 0 && (
            <div className={styles.vacio}>
              <span>📭</span>
              <p>Aún no hay entregas. ¡Registra la primera!</p>
            </div>
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
        <button className={styles.acc} onClick={() => nav('/notificaciones')}>
          <span>🔔</span>
          <span>Recordatorios{recordatoriosHoy.length > 0 ? ` (${recordatoriosHoy.length})` : ''}</span>
        </button>
        <button className={styles.acc} onClick={() => nav('/graficas')}><span>📊</span><span>Gráficas</span></button>
        <button className={styles.acc} onClick={() => setBackup(true)}><span>💾</span><span>Respaldo</span></button>
      </div>

      {/* Modal notificaciones al entrar */}
      {notif && (
        <div className={styles.notifOv} onClick={() => setNotif(false)}>
          <div className={styles.notifPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.notifHdr}>
              <span className={styles.notifIco}>🔔</span>
              <h2 className={styles.notifTit}>Recordatorios de hoy</h2>
              <button className={styles.notifCls} onClick={() => setNotif(false)}>✕</button>
            </div>
            <div className={styles.notifLista}>
              {recordatoriosHoy.map(r => (
                <div key={r.id} className={styles.notifItem}
                  onClick={() => { setNotif(false); nav(`/editar/${r.eid}`) }}>
                  <div className={styles.notifCliente}>👤 {r.cliente}</div>
                  <div className={styles.notifMonto}>💰 Cobrar {fmt(r.total)}</div>
                </div>
              ))}
            </div>
            <button className={styles.notifBtn} onClick={() => { setNotif(false); nav('/notificaciones') }}>
              Ver todos los recordatorios →
            </button>
          </div>
        </div>
      )}

      {backup && <BackupPanel onClose={() => setBackup(false)} />}
    </div>
  )
}
