import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './ListaEntregas.module.css'

const fmt = (n) => `$${n.toLocaleString('es-MX')}`
const fmtFecha = (str) => {
  const [, m, d] = str.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${d} ${meses[parseInt(m)-1]}`
}
const totalCajas = (cats) => (cats||[]).reduce((s, c) => s + (Number(c.cajas)||0), 0)

export default function ListaEntregas() {
  const { entregas, marcarPagado } = useApp()
  const nav = useNavigate()
  const [filtro, setFiltro] = useState('todas')
  const [confirmId, setConfirmId] = useState(null)
  const [expandId, setExpandId] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const filtradas = entregas.filter(e => {
    const matchF = filtro === 'todas' || (filtro === 'pendientes' && !e.pagado) || (filtro === 'pagadas' && e.pagado)
    const matchB = e.cliente.toLowerCase().includes(busqueda.toLowerCase())
    return matchF && matchB
  })

  const entregaConfirm = confirmId ? entregas.find(e => e.id === confirmId) : null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.titulo}>📋 Entregas</h1>
        <span className={styles.badge}>{filtradas.length}</span>
      </div>

      {/* Buscador */}
      <div className={styles.buscador}>
        <span>🔎</span>
        <input className={styles.inputBusqueda} placeholder="Buscar cliente..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        {busqueda && <button className={styles.clearBtn} onClick={() => setBusqueda('')}>✕</button>}
      </div>

      {/* Filtros */}
      <div className={styles.filtros}>
        {['todas','pendientes','pagadas'].map(f => (
          <button key={f}
            className={`${styles.filtroBtn} ${filtro === f ? styles.filtroActivo : ''}`}
            onClick={() => setFiltro(f)}>
            {f === 'todas' ? '🔍 Todas' : f === 'pendientes' ? '❌ Pendientes' : '✅ Pagadas'}
          </button>
        ))}
      </div>

      <div className={styles.lista}>
        {filtradas.length === 0 && (
          <div className={styles.vacio}><span>📭</span><p>Sin entregas en este filtro</p></div>
        )}

        {filtradas.map((e, i) => {
          const cats = e.categorias || []
          const abierto = expandId === e.id
          return (
            <div key={e.id} className={styles.card} style={{ animationDelay: `${i * 0.05}s` }}>
              {/* Cabecera de la card */}
              <div className={styles.cardTop}>
                <div className={styles.cardFecha}>📅 {fmtFecha(e.fecha)}</div>
                <span className={e.pagado ? 'badge-pagado' : 'badge-pendiente'}>
                  {e.pagado ? '✅ Pagado' : '❌ Pendiente'}
                </span>
              </div>

              {/* Cliente + resumen */}
              <div className={styles.cardInfo}>
                <div className={styles.cardCliente}>👤 {e.cliente}</div>
                <div className={styles.cardResumen}>
                  <span className={styles.chipCajas}>📦 {totalCajas(cats)} cajas</span>
                  <span className={styles.chipTotal}>💰 {fmt(e.total)}</span>
                </div>
              </div>

              {/* Categorías */}
              {cats.length > 0 && (
                <div className={styles.catsWrap}>
                  {/* Mostrar primera cat siempre, resto al expandir */}
                  {(abierto ? cats : cats.slice(0, 1)).map(c => (
                    <div key={c.id} className={styles.catRow}>
                      <span className={styles.catNombre}>{c.nombre || 'Sin nombre'}</span>
                      <span className={styles.catNum}>{c.cajas} cajas</span>
                      <span className={styles.catPrecio}>${Number(c.precio).toLocaleString('es-MX')}/u</span>
                      <span className={styles.catSub}>{fmt((Number(c.cajas)||0)*(Number(c.precio)||0))}</span>
                    </div>
                  ))}
                  {cats.length > 1 && (
                    <button className={styles.verMasBtn} onClick={() => setExpandId(abierto ? null : e.id)}>
                      {abierto ? '▲ Ver menos' : `▼ +${cats.length - 1} categoría${cats.length - 1 > 1 ? 's' : ''} más`}
                    </button>
                  )}
                </div>
              )}

              {e.nota ? <div className={styles.cardNota}>📝 {e.nota}</div> : null}

              {/* Acciones */}
              <div className={styles.cardAcciones}>
                <button className={styles.btnEditar} onClick={() => nav(`/editar/${e.id}`)}>
                  ✏️ Editar
                </button>
                {!e.pagado && (
                  <button className={styles.btnPagar} onClick={() => setConfirmId(e.id)}>
                    💲 Marcar pagado
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal confirmación */}
      {confirmId && entregaConfirm && (
        <div className={styles.overlay} onClick={() => setConfirmId(null)}>
          <div className={styles.modal} onClick={ev => ev.stopPropagation()}>
            <div className={styles.modalIcon}>⚠️</div>
            <h2 className={styles.modalTitulo}>Confirmar pago</h2>
            <p className={styles.modalTexto}>
              ¿Seguro que quieres marcar esta entrega como <strong>PAGADA</strong>?
            </p>
            <div className={styles.modalDetalle}>
              <span>💰 {fmt(entregaConfirm.total)}</span>
              <span>👤 {entregaConfirm.cliente}</span>
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.btnCancelar} onClick={() => setConfirmId(null)}>Cancelar</button>
              <button className={styles.btnConfirmar} onClick={() => { marcarPagado(confirmId); setConfirmId(null) }}>
                ✅ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
