import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import BackupPanel from '../components/BackupPanel'
import styles from './Dashboard.module.css'

const fmt = (n) => `$${n.toLocaleString('es-MX')}`

const fmtFecha = (str) => {
  const [, m, d] = str.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${d} ${meses[parseInt(m)-1]}`
}

const diasRestantes = (fin) => {
  if (!fin) return null
  return Math.ceil((new Date(fin) - new Date()) / 86400000)
}

export default function Dashboard() {
  const { entregas, totales } = useApp()
  const { profile, logout, isAdmin } = useAuth()
  const nav = useNavigate()
  const [showBackup, setShowBackup] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const ultimas = entregas.slice(0, 4)

  const dias = diasRestantes(profile?.suscripcion_fin)
  const subAlerta = dias !== null && dias <= 7

  return (
    <div className={styles.page}>
      {/* Header con usuario */}
      <div className={styles.header}>
        <div className={styles.logoRow}>
          <div className={styles.logo}>🌵</div>
          <div>
            <h1 className={styles.titulo}>Control Nopal</h1>
            <p className={styles.subtitulo}>
              {profile?.nombre || profile?.email?.split('@')[0] || 'Usuario'}
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.menuBtn} onClick={() => setShowMenu(v => !v)}>⋯</button>
          {showMenu && (
            <div className={styles.menuDrop} onClick={() => setShowMenu(false)}>
              <button className={styles.menuItem} onClick={() => setShowBackup(true)}>💾 Respaldo</button>
              {isAdmin && (
                <button className={styles.menuItem} onClick={() => nav('/admin')}>⚙️ Panel Admin</button>
              )}
              <button className={`${styles.menuItem} ${styles.menuLogout}`}
                onClick={() => logout()}>🚪 Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>

      {/* Alerta suscripción */}
      {subAlerta && (
        <div className={`${styles.subAlerta} ${dias <= 0 ? styles.subVencida : ''}`}>
          {dias <= 0
            ? '❌ Tu suscripción ha vencido. Contacta al administrador.'
            : `⚠️ Tu suscripción vence en ${dias} día${dias !== 1 ? 's' : ''}. Contacta al administrador para renovar.`
          }
        </div>
      )}

      {/* Resumen cards */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.cardPendiente}`}>
          <span className={styles.cardIcon}>💰</span>
          <div>
            <div className={styles.cardLabel}>Pendiente</div>
            <div className={styles.cardValor}>{fmt(totales.pendiente)}</div>
          </div>
        </div>
        <div className={`${styles.card} ${styles.cardCobrado}`}>
          <span className={styles.cardIcon}>✅</span>
          <div>
            <div className={styles.cardLabel}>Cobrado</div>
            <div className={styles.cardValor}>{fmt(totales.cobrado)}</div>
          </div>
        </div>
        <div className={`${styles.card} ${styles.cardCajas}`}>
          <span className={styles.cardIcon}>📦</span>
          <div>
            <div className={styles.cardLabel}>Cajas totales</div>
            <div className={styles.cardValor}>{totales.cajas}</div>
          </div>
        </div>
      </div>

      {/* Botón nueva entrega */}
      <button className={styles.btnNueva} onClick={() => nav('/nueva')}>
        <span>➕</span> Nueva entrega
      </button>

      {/* Últimas entregas */}
      <div className={styles.seccion}>
        <div className={styles.seccionHeader}>
          <h2 className={styles.seccionTitulo}>📋 Últimas entregas</h2>
          <button className={styles.verTodas} onClick={() => nav('/entregas')}>Ver todas →</button>
        </div>
        <div className={styles.lista}>
          {ultimas.length === 0 && (
            <div className={styles.sinEntregas}>
              <span>📭</span>
              <p>Aún no hay entregas.<br/>¡Registra la primera!</p>
            </div>
          )}
          {ultimas.map((e, i) => (
            <div key={e.id} className={styles.item} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className={styles.itemFecha}>{fmtFecha(e.fecha)}</div>
              <div className={styles.itemInfo}>
                <span className={styles.itemCliente}>{e.cliente.split(' ')[0]}</span>
                <span className={styles.itemDetalle}>
                  {(e.categorias||[]).reduce((s,c)=>s+(Number(c.cajas)||0),0)} cajas · {fmt(e.total)}
                </span>
              </div>
              <span className={e.pagado ? 'badge-pagado' : 'badge-pendiente'}>
                {e.pagado ? '✅' : '❌'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Acceso rápido */}
      <div className={styles.accesos}>
        <button className={styles.acceso} onClick={() => nav('/notificaciones')}>
          <span>🔔</span><span>Recordatorios</span>
        </button>
        <button className={styles.acceso} onClick={() => nav('/graficas')}>
          <span>📊</span><span>Gráficas</span>
        </button>
        <button className={styles.acceso} onClick={() => setShowBackup(true)}>
          <span>💾</span><span>Respaldo</span>
        </button>
      </div>

      {/* Backdrop del menú */}
      {showMenu && <div className={styles.menuBackdrop} onClick={() => setShowMenu(false)} />}

      {/* Panel de respaldo */}
      {showBackup && <BackupPanel onClose={() => setShowBackup(false)} />}
    </div>
  )
}
