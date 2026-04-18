import { createContext, useContext, useState, useEffect } from 'react'

const AppCtx = createContext(null)

const migrar = (e) => {
  if (e.categorias) return e
  return { ...e, categorias: [{ id: 1, nombre: 'Nopal', cajas: e.cajas ?? 0, precio: e.precioCaja ?? 0 }] }
}
export const calcTotal = (cats) =>
  (cats || []).reduce((s, c) => s + (Number(c.cajas) || 0) * (Number(c.precio) || 0), 0)
export const calcCajas = (cats) =>
  (cats || []).reduce((s, c) => s + (Number(c.cajas) || 0), 0)

const makeKeys = (uid) => ({
  entregas: `nopal_${uid}_entregas`,
  clientes: `nopal_${uid}_clientes`,
})

export const exportarBackup = (uid, entregas, clientes) => {
  const blob = new Blob([JSON.stringify({ v: 2, uid, fecha: new Date().toISOString(), entregas, clientes }, null, 2)], { type: 'application/json' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `nopal-backup-${new Date().toISOString().split('T')[0]}.json` })
  a.click(); URL.revokeObjectURL(a.href)
}

export const importarBackup = (file) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = (e) => { try { res(JSON.parse(e.target.result)) } catch { rej(new Error('Archivo inválido')) } }
  r.readAsText(file)
})

export function AppProvider({ children, userId }) {
  const keys = userId ? makeKeys(userId) : { entregas: 'nopal-demo-entregas', clientes: 'nopal-demo-clientes' }

  const loadEntregas = () => {
    try {
      const s = localStorage.getItem(keys.entregas)
      if (!s) return []
      return JSON.parse(s).map(migrar).map(e => ({ ...e, total: calcTotal(e.categorias) }))
    } catch { return [] }
  }

  const loadClientes = () => {
    try {
      const s = localStorage.getItem(keys.clientes)
      return s ? JSON.parse(s) : []
    } catch { return [] }
  }

  const [entregas, setEntregas] = useState(loadEntregas)
  const [clientes, setClientes] = useState(loadClientes)

  useEffect(() => { setEntregas(loadEntregas()); setClientes(loadClientes()) }, [userId]) // eslint-disable-line
  useEffect(() => { localStorage.setItem(keys.entregas, JSON.stringify(entregas)) }, [entregas]) // eslint-disable-line
  useEffect(() => { localStorage.setItem(keys.clientes, JSON.stringify(clientes)) }, [clientes]) // eslint-disable-line

  const agregarEntrega = (e) => {
    const total = calcTotal(e.categorias)
    setEntregas(prev => [{ ...e, id: Date.now(), total }, ...prev])
    if (!clientes.includes(e.cliente)) setClientes(prev => [...prev, e.cliente].sort())
  }
  const editarEntrega  = (id, d) => {
    const total = calcTotal(d.categorias)
    setEntregas(prev => prev.map(e => e.id === id ? { ...e, ...d, total } : e))
  }
  const marcarPagado    = (id) => setEntregas(prev => prev.map(e => e.id === id ? { ...e, pagado: true } : e))
  const eliminarEntrega = (id) => setEntregas(prev => prev.filter(e => e.id !== id))
  const agregarCliente  = (n)  => { if (n && !clientes.includes(n)) setClientes(prev => [...prev, n].sort()) }

  const totales = entregas.reduce((acc, e) => ({
    pendiente: acc.pendiente + (!e.pagado ? e.total : 0),
    cobrado:   acc.cobrado   + ( e.pagado ? e.total : 0),
    cajas:     acc.cajas     + calcCajas(e.categorias),
  }), { pendiente: 0, cobrado: 0, cajas: 0 })

  const exportar = () => exportarBackup(userId, entregas, clientes)
  const importar = async (file) => {
    const data = await importarBackup(file)
    if (!data.entregas || !data.clientes) throw new Error('Formato inválido')
    setEntregas(data.entregas.map(migrar).map(e => ({ ...e, total: calcTotal(e.categorias) })))
    setClientes(data.clientes)
  }

  return (
    <AppCtx.Provider value={{ entregas, clientes, totales, agregarEntrega, editarEntrega, marcarPagado, eliminarEntrega, agregarCliente, exportar, importar }}>
      {children}
    </AppCtx.Provider>
  )
}

export const useApp = () => useContext(AppCtx)