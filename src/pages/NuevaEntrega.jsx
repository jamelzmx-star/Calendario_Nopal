import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import CategoriasEditor from '../components/CategoriasEditor'
import styles from './NuevaEntrega.module.css'

const hoy = () => new Date().toISOString().split('T')[0]
const newCat = () => ({ id: Date.now() + Math.random(), nombre: '', cajas: '', precio: '' })

export default function NuevaEntrega() {
  const { clientes, agregarEntrega, agregarCliente } = useApp()
  const nav = useNavigate()
  const location = useLocation()
  const fechaInicial = location.state?.fecha || hoy()

  const [form, setForm] = useState({
    fecha: fechaInicial,
    cliente: clientes[0] || '',
    clienteNuevo: '',
    usarNuevo: false,
    nota: '',
    recordatorio: 3,
  })
  const [categorias, setCategorias] = useState([newCat()])
  const [guardado, setGuardado] = useState(false)
  const [errores, setErrores] = useState({})

  const total = categorias.reduce((s, c) => s + (Number(c.cajas)||0) * (Number(c.precio)||0), 0)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const validar = () => {
    const e = {}
    const clienteFinal = form.usarNuevo ? form.clienteNuevo.trim() : form.cliente
    if (!clienteFinal) e.cliente = 'Elige o escribe un cliente'
    const catValidas = categorias.filter(c => c.cajas && c.precio)
    if (catValidas.length === 0) e.categorias = 'Agrega al menos una categoría con cantidad y precio'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleGuardar = () => {
    if (!validar()) return
    const clienteFinal = form.usarNuevo ? form.clienteNuevo.trim() : form.cliente
    if (form.usarNuevo && clienteFinal) agregarCliente(clienteFinal)
    const catsLimpias = categorias
      .filter(c => c.cajas && c.precio)
      .map(c => ({ ...c, cajas: Number(c.cajas), precio: Number(c.precio) }))
    agregarEntrega({
      fecha: form.fecha,
      cliente: clienteFinal,
      categorias: catsLimpias,
      pagado: false,
      nota: form.nota,
      recordatorio: form.recordatorio,
    })
    setGuardado(true)
    setTimeout(() => nav('/'), 1000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => nav(-1)}>←</button>
        <h1 className={styles.titulo}>Nueva Entrega</h1>
        <span>➕</span>
      </div>

      <div className={styles.form}>
        {/* Fecha */}
        <div className={styles.campo}>
          <label className={styles.label}>📅 Fecha</label>
          <input type="date" className={styles.input} value={form.fecha}
            onChange={e => set('fecha', e.target.value)} />
        </div>

        {/* Cliente */}
        <div className={styles.campo}>
          <label className={styles.label}>👤 Quién recibe</label>
          <div className={styles.toggleRow}>
            <button className={`${styles.toggle} ${!form.usarNuevo ? styles.toggleActive : ''}`}
              onClick={() => set('usarNuevo', false)}>Existente</button>
            <button className={`${styles.toggle} ${form.usarNuevo ? styles.toggleActive : ''}`}
              onClick={() => set('usarNuevo', true)}>Nuevo</button>
          </div>
          {form.usarNuevo ? (
            <input className={styles.input} placeholder="Nombre del nuevo cliente"
              value={form.clienteNuevo} onChange={e => set('clienteNuevo', e.target.value)} />
          ) : (
            <select className={styles.input} value={form.cliente}
              onChange={e => set('cliente', e.target.value)}>
              {clientes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {errores.cliente && <span className={styles.error}>{errores.cliente}</span>}
        </div>

        {/* Categorías */}
        <div className={styles.campo}>
          <label className={styles.label}>📦 Categorías de producto</label>
          {errores.categorias && <span className={styles.error}>{errores.categorias}</span>}
          <CategoriasEditor categorias={categorias} onChange={setCategorias} />
        </div>

        {/* Total */}
        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>💰 Total automático</span>
          <span className={styles.totalValor}>${total.toLocaleString('es-MX')}</span>
        </div>

        {/* Recordatorio */}
        <div className={styles.campo}>
          <label className={styles.label}>🔔 Recordatorio</label>
          <div className={styles.recordatorios}>
            {[1, 3, 7].map(d => (
              <button key={d}
                className={`${styles.recBtn} ${form.recordatorio === d ? styles.recActive : ''}`}
                onClick={() => set('recordatorio', d)}>
                {d} {d === 1 ? 'día' : 'días'}
                {d === 3 && <span className={styles.recTag}>recomendado</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Nota */}
        <div className={styles.campo}>
          <label className={styles.label}>📝 Nota (opcional)</label>
          <textarea className={styles.textarea} placeholder="Observaciones..." rows={2}
            value={form.nota} onChange={e => set('nota', e.target.value)} />
        </div>

        <button className={`${styles.btnGuardar} ${guardado ? styles.btnExito : ''}`}
          onClick={handleGuardar}>
          {guardado ? '✅ ¡Guardado!' : '💾 Guardar entrega'}
        </button>
      </div>
    </div>
  )
}
