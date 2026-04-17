import { createContext, useContext, useState, useEffect } from 'react'

const AppCtx = createContext(null)

// ──── Helpers ────────────────────────────────────────────────────
const migrar = (e) => {
  if (e.categorias) return e
  return { ...e, categorias: [{ id: 1, nombre: 'Nopal', cajas: e.cajas ?? 0, precio: e.precioCaja ?? 0 }] }
}
export const calcTotal = (cats) =>
  (cats || []).reduce((s, c) => s + (Number(c.cajas) || 0) * (Number(c.precio) || 0), 0)
export const calcCajas = (cats) =>
  (cats || []).reduce((s, c) => s + (Number(c.cajas) || 0), 0)

const ENTREGAS_DEMO = [
  { id: 1, fecha: '2026-04-01', cliente: 'Juan Pérez',    categorias: [{ id:1, nombre:'Nopal grande',  cajas:10, precio:50 }], pagado: false, nota: '', recordatorio: 3 },
  { id: 2, fecha: '2026-03-31', cliente: 'Pedro Ramírez', categorias: [{ id:1, nombre:'Nopal mediano', cajas:8,  precio:50 }], pagado: true,  nota: '', recordatorio: 3 },
  { id: 3, fecha: '2026-03-30', cliente: 'Luis García',   categorias: [{ id:1, nombre:'Nopal grande',  cajas:7,  precio:55 }, { id:2, nombre:'Nopal chico', cajas:5, precio:30 }], pagado: false, nota: 'Entrega extra', recordatorio: 3 },
].map(e => ({ ...e, total: calcTotal(e.categorias) }))

// ──── Keys por usuario (datos aislados en localStorage) ──────────
const makeKeys = (userId) => ({
  entregas: `nopal_${userId}_entregas`,
  clientes: `nopal_${userId}_clientes`,
})

// ──── Backup helpers ─────────────────────────────────────────────
export const exportarBackup = (userId, entregas, clientes) => {
  const data = JSON.stringify({ v: 2, userId, fecha: new Date().toISOString(), entregas, clientes }, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `nopal-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export const importarBackup = (file) =>
  new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try { res(JSON.parse(e.target.result)) }
      catch { rej(new Error('Archivo inválido')) }
    }
    reader.readAsText(file)
  })

// ──── Provider ────────────────────────────────────────────────────
export function AppProvider({ children, userId }) {
  const keys = userId ? makeKeys(userId) : { entregas: 'nopal-entregas', clientes: 'nopal-clientes' }

  const [entregas, setEntregas] = useState(() => {
    try {
      const saved = localStorage.getItem(keys.entregas)
      const parsed = saved ? JSON.parse(saved) : ENTREGAS_DEMO
      return parsed.map(migrar).map(e => ({ ...e, total: calcTotal(e.categorias) }))
    } catch { return ENTREGAS_DEMO }
  })

  const [clientes, setClientes] = useState(() => {
    try {
      const saved = localStorage.getItem(keys.clientes)
      return saved ? JSON.parse(saved) : ['Juan Pérez', 'Pedro Ramírez', 'Luis García']
    } catch { return [] }
  })

  // Re-inicializar cuando cambia el userId (login/logout)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(keys.entregas)
      const parsed = saved ? JSON.parse(saved) : ENTREGAS_DEMO
      setEntregas(parsed.map(migrar).map(e => ({ ...e, total: calcTotal(e.categorias) })))
    } catch { setEntregas(ENTREGAS_DEMO) }

    try {
      const saved = localStorage.getItem(keys.clientes)
      setClientes(saved ? JSON.parse(saved) : [])
    } catch { setClientes([]) }
  }, [userId]) // eslint-disable-line

  useEffect(() => { localStorage.setItem(keys.entregas, JSON.stringify(entregas)) }, [entregas]) // eslint-disable-line
  useEffect(() => { localStorage.setItem(keys.clientes, JSON.stringify(clientes)) }, [clientes]) // eslint-disable-line

  // ── CRUD ─────────────────────────────────────────────────────
  const agregarEntrega = (entrega) => {
    const total = calcTotal(entrega.categorias)
    setEntregas(prev => [{ ...entrega, id: Date.now(), total }, ...prev])
    if (!clientes.includes(entrega.cliente))
      setClientes(prev => [...prev, entrega.cliente].sort())
  }

  const editarEntrega = (id, datos) => {
    const total = calcTotal(datos.categorias)
    setEntregas(prev => prev.map(e => e.id === id ? { ...e, ...datos, total } : e))
  }

  const marcarPagado   = (id) => setEntregas(prev => prev.map(e => e.id === id ? { ...e, pagado: true }  : e))
  const eliminarEntrega = (id) => setEntregas(prev => prev.filter(e => e.id !== id))
  const agregarCliente = (n) => { if (n && !clientes.includes(n)) setClientes(prev => [...prev, n].sort()) }

  const totales = entregas.reduce((acc, e) => ({
    pendiente: acc.pendiente + (!e.pagado ? e.total : 0),
    cobrado:   acc.cobrado   + ( e.pagado ? e.total : 0),
    cajas:     acc.cajas     + calcCajas(e.categorias),
  }), { pendiente: 0, cobrado: 0, cajas: 0 })

  // ── Backup ───────────────────────────────────────────────────
  const exportar = () => exportarBackup(userId, entregas, clientes)

  const importar = async (file) => {
    const data = await importarBackup(file)
    if (!data.entregas || !data.clientes) throw new Error('Formato inválido')
    const importadas = data.entregas.map(migrar).map(e => ({ ...e, total: calcTotal(e.categorias) }))
    setEntregas(importadas)
    setClientes(data.clientes)
  }

  return (
    <AppCtx.Provider value={{
      entregas, clientes, totales,
      agregarEntrega, editarEntrega, marcarPagado, eliminarEntrega, agregarCliente,
      exportar, importar,
    }}>
      {children}
    </AppCtx.Provider>
  )
}

export const useApp = () => useContext(AppCtx)
