import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import CategoriasEditor from '../components/CategoriasEditor'
import styles from './EditarEntrega.module.css'

const fmt = (n) => `$${n.toLocaleString('es-MX')}`

export default function EditarEntrega() {
  const { id } = useParams()
  const { entregas, clientes, editarEntrega, marcarPagado, eliminarEntrega } = useApp()
  const nav = useNavigate()
  const entrega = entregas.find(e => e.id === Number(id))
  const [confirmPago, setConfirmPago] = useState(false)
  const [confirmElim, setConfirmElim] = useState(false)
  const [guardado, setGuardado] = useState(false)

  const [form, setForm] = useState({
    cliente:  entrega?.cliente  || '',
    nota:     entrega?.nota     || '',
    fecha:    entrega?.fecha    || '',
  })
  const [categorias, setCategorias] = useState(
    entrega?.categorias?.map(c => ({ ...c })) || [{ id: 1, nombre: 'Nopal', cajas: '', precio: '' }]
  )

  if (!entrega) return (
    <div className={styles.page}>
      <p style={{ padding: 24 }}>Entrega no encontrada.</p>
      <button onClick={() => nav('/')} style={{ margin: 24 }}>Volver</button>
    </div>
  )

  const total = categorias.reduce((s, c) => s + (Number(c.cajas)||0)*(Number(c.precio)||0), 0)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleGuardar = () => {
    const catsLimpias = categorias
      .filter(c => c.cajas && c.precio)
      .map(c => ({ ...c, cajas: Number(c.cajas), precio: Number(c.precio) }))
    if (!catsLimpias.length) return
    editarEntrega(entrega.id, { ...form, categorias: catsLimpias })
    setGuardado(true)
    setTimeout(() => nav('/entregas'), 900)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => nav(-1)}>←</button>
        <h1 className={styles.titulo}>✏️ Editar Entrega</h1>
        <button className={styles.btnEliminar} onClick={() => setConfirmElim(true)}>🗑️</button>
      </div>

      {/* Estado */}
      <div className={`${styles.estadoCard} ${entrega.pagado ? styles.pagado : styles.pendiente}`}>
        <span className={styles.estadoIcon}>{entrega.pagado ? '✅' : '❌'}</span>
        <div>
          <div className={styles.estadoLabel}>Estado</div>
          <div className={styles.estadoValor}>{entrega.pagado ? 'Pagado' : 'Pendiente'}</div>
        </div>
        {!entrega.pagado && (
          <button className={styles.btnPagar} onClick={() => setConfirmPago(true)}>
            💲 Marcar pagado
          </button>
        )}
      </div>

      <div className={styles.form}>
        <div className={styles.campo}>
          <label className={styles.label}>📅 Fecha</label>
          <input type="date" className={styles.input} value={form.fecha}
            onChange={e => set('fecha', e.target.value)} />
        </div>

        <div className={styles.campo}>
          <label className={styles.label}>👤 Cliente</label>
          <select className={styles.input} value={form.cliente}
            onChange={e => set('cliente', e.target.value)}>
            {clientes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.campo}>
          <label className={styles.label}>📦 Categorías de producto</label>
          <CategoriasEditor categorias={categorias} onChange={setCategorias} />
        </div>

        <div className={styles.totalCard}>
          <span>💰 Total</span>
          <span className={styles.totalValor}>{fmt(total)}</span>
        </div>

        <div className={styles.campo}>
          <label className={styles.label}>📝 Nota</label>
          <textarea className={styles.textarea} rows={2} value={form.nota}
            onChange={e => set('nota', e.target.value)} placeholder="Observaciones..." />
        </div>

        <button className={`${styles.btnGuardar} ${guardado ? styles.btnExito : ''}`}
          onClick={handleGuardar}>
          {guardado ? '✅ ¡Guardado!' : '💾 Guardar cambios'}
        </button>
      </div>

      {/* Modal pago */}
      {confirmPago && (
        <div className={styles.overlay} onClick={() => setConfirmPago(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>⚠️</div>
            <h2 className={styles.modalTitulo}>Confirmar pago</h2>
            <p className={styles.modalTexto}>¿Marcar como <strong>PAGADA</strong>?</p>
            <div className={styles.modalDetalle}>
              <span>💰 {fmt(entrega.total)}</span>
              <span>👤 {entrega.cliente}</span>
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.btnCancelar} onClick={() => setConfirmPago(false)}>Cancelar</button>
              <button className={styles.btnConfirmar} onClick={() => { marcarPagado(entrega.id); setConfirmPago(false); nav('/entregas') }}>✅ Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {confirmElim && (
        <div className={styles.overlay} onClick={() => setConfirmElim(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <h2 className={styles.modalTitulo}>Eliminar entrega</h2>
            <p className={styles.modalTexto}>Esta acción no se puede deshacer.</p>
            <div className={styles.modalBtns}>
              <button className={styles.btnCancelar} onClick={() => setConfirmElim(false)}>Cancelar</button>
              <button className={styles.btnEliminarConfirm} onClick={() => { eliminarEntrega(entrega.id); nav('/entregas') }}>🗑️ Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
