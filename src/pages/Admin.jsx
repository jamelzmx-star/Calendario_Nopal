import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './Admin.module.css'

const PLANES = { mensual: 30, anual: 365 }

const diasRestantes = (fin) => {
  if (!fin) return null
  const diff = new Date(fin) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const fmtFecha = (str) => {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Admin() {
  const { isAdmin, logout } = useAuth()
  const nav = useNavigate()
  const [usuarios, setUsuarios]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null) // null | 'nuevo' | 'editar'
  const [seleccionado, setSelec]  = useState(null)
  const [form, setForm]           = useState({ email: '', nombre: '', plan: 'mensual', activo: true, notas: '' })
  const [passNueva, setPassNueva] = useState('')
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState(null)

  if (!isAdmin) {
    return (
      <div className={styles.noAcceso}>
        <span>🚫</span>
        <p>Sin acceso. Solo el administrador puede ver esta sección.</p>
        <button onClick={() => nav('/')}>Volver</button>
      </div>
    )
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (!error) setUsuarios(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Usuarios con suscripción próxima a vencer (≤ 7 días) o ya vencida
  const alertas = usuarios.filter(u => {
    const d = diasRestantes(u.suscripcion_fin)
    return d !== null && d <= 7
  })

  const abrirNuevo = () => {
    setForm({ email: '', nombre: '', plan: 'mensual', activo: true, notas: '' })
    setPassNueva('')
    setSelec(null)
    setModal('nuevo')
  }

  const abrirEditar = (u) => {
    setSelec(u)
    setForm({ email: u.email, nombre: u.nombre || '', plan: u.plan || 'mensual', activo: u.activo, notas: u.notas || '' })
    setPassNueva('')
    setModal('editar')
  }

  const cerrar = () => { setModal(null); setSelec(null); setMsg(null) }

  const calcFin = (plan) => {
    const d = new Date()
    d.setDate(d.getDate() + PLANES[plan])
    return d.toISOString()
  }

  const guardarNuevo = async () => {
    if (!form.email || !passNueva) { setMsg({ tipo: 'error', texto: 'Correo y contraseña son obligatorios' }); return }
    setSaving(true)
    // 1. Crear usuario en Supabase Auth (usando service role si disponible, o inviteUserByEmail)
    // Aquí usamos signUp con autoconfirm (configúralo en Supabase: Auth > Settings > disable email confirm)
    const { data: authData, error: authErr } = await supabase.auth.admin
      ? supabase.auth.admin.createUser({ email: form.email, password: passNueva, email_confirm: true })
      : await supabase.auth.signUp({ email: form.email, password: passNueva })

    // Si no hay service role, intentamos con signUp normal
    const userId = authData?.user?.id
    if (authErr || !userId) {
      // Intentar vía signUp
      const { data: s, error: se } = await supabase.auth.signUp({ email: form.email, password: passNueva })
      if (se || !s?.user?.id) {
        setMsg({ tipo: 'error', texto: authErr?.message || se?.message || 'Error creando usuario' })
        setSaving(false); return
      }
      await insertarPerfil(s.user.id)
    } else {
      await insertarPerfil(userId)
    }
    setSaving(false)
  }

  const insertarPerfil = async (userId) => {
    const fin = calcFin(form.plan)
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email: form.email,
      nombre: form.nombre,
      plan: form.plan,
      activo: form.activo,
      suscripcion_inicio: new Date().toISOString(),
      suscripcion_fin: fin,
      notas: form.notas,
    })
    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }
    setMsg({ tipo: 'ok', texto: '✅ Usuario creado correctamente' })
    await cargar()
    setTimeout(cerrar, 1200)
  }

  const guardarEditar = async () => {
    setSaving(true)
    const updates = {
      nombre: form.nombre,
      plan: form.plan,
      activo: form.activo,
      notas: form.notas,
    }
    // Si cambia de plan, recalcular fecha fin desde hoy
    if (form.plan !== seleccionado.plan || !seleccionado.suscripcion_fin) {
      updates.suscripcion_fin = calcFin(form.plan)
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', seleccionado.id)
    if (error) { setMsg({ tipo: 'error', texto: error.message }); setSaving(false); return }

    // Si se especificó nueva contraseña (solo con service role / admin API)
    if (passNueva.length >= 6) {
      await supabase.auth.admin?.updateUserById(seleccionado.id, { password: passNueva })
    }
    setMsg({ tipo: 'ok', texto: '✅ Guardado correctamente' })
    await cargar()
    setTimeout(cerrar, 1000)
    setSaving(false)
  }

  const toggleActivo = async (u) => {
    await supabase.from('profiles').update({ activo: !u.activo }).eq('id', u.id)
    cargar()
  }

  const renovar = async (u) => {
    const fin = calcFin(u.plan || 'mensual')
    await supabase.from('profiles').update({ suscripcion_fin: fin, activo: true }).eq('id', u.id)
    cargar()
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>⚙️ Panel Admin</h1>
          <p className={styles.sub}>{usuarios.length} usuarios registrados</p>
        </div>
        <div className={styles.headerBtns}>
          <button className={styles.btnNuevo} onClick={abrirNuevo}>➕ Nuevo usuario</button>
          <button className={styles.btnSalir} onClick={async () => { await logout(); nav('/login') }}>
            🚪 Salir
          </button>
        </div>
      </div>

      {/* Alertas suscripción */}
      {alertas.length > 0 && (
        <div className={styles.alertasBox}>
          <div className={styles.alertasTitulo}>🔔 Suscripciones próximas a vencer</div>
          {alertas.map(u => {
            const d = diasRestantes(u.suscripcion_fin)
            return (
              <div key={u.id} className={`${styles.alerta} ${d <= 0 ? styles.alertaVencida : ''}`}>
                <span>👤 {u.nombre || u.email}</span>
                <span>{d <= 0 ? '❌ Vencida' : `⏰ ${d} día${d !== 1 ? 's' : ''} restante${d !== 1 ? 's' : ''}`}</span>
                <button className={styles.btnRenovar} onClick={() => renovar(u)}>🔄 Renovar</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabla de usuarios */}
      {loading ? (
        <div className={styles.cargando}><span className={styles.spinner} /></div>
      ) : (
        <div className={styles.lista}>
          {usuarios.map(u => {
            const dias = diasRestantes(u.suscripcion_fin)
            const estadoSub = dias === null ? 'sin-fecha' : dias <= 0 ? 'vencida' : dias <= 7 ? 'pronto' : 'ok'
            return (
              <div key={u.id} className={`${styles.card} ${!u.activo ? styles.cardInactivo : ''}`}>
                <div className={styles.cardLeft}>
                  <div className={styles.cardAvatar}>{(u.nombre || u.email)[0].toUpperCase()}</div>
                  <div>
                    <div className={styles.cardNombre}>{u.nombre || '—'}</div>
                    <div className={styles.cardEmail}>{u.email}</div>
                    <div className={styles.cardMeta}>
                      <span className={`${styles.planTag} ${styles[`plan_${u.plan}`]}`}>
                        {u.plan === 'mensual' ? '📅 Mensual' : '🗓️ Anual'}
                      </span>
                      <span className={`${styles.subTag} ${styles[`sub_${estadoSub}`]}`}>
                        {estadoSub === 'vencida' ? '❌ Vencida' :
                         estadoSub === 'pronto'  ? `⚠️ ${dias}d` :
                         estadoSub === 'ok'      ? `✅ ${dias}d` : '—'}
                        {u.suscripcion_fin ? ` · ${fmtFecha(u.suscripcion_fin)}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardRight}>
                  <span className={u.activo ? styles.activoBadge : styles.inactivoBadge}>
                    {u.activo ? '● Activo' : '● Inactivo'}
                  </span>
                  <div className={styles.cardBtns}>
                    <button className={styles.btnEditar} onClick={() => abrirEditar(u)}>✏️</button>
                    <button
                      className={u.activo ? styles.btnDesactivar : styles.btnActivar}
                      onClick={() => toggleActivo(u)}
                    >
                      {u.activo ? '🔒' : '🔓'}
                    </button>
                    <button className={styles.btnRenovar2} onClick={() => renovar(u)} title="Renovar suscripción">🔄</button>
                  </div>
                </div>
              </div>
            )
          })}

          {usuarios.length === 0 && (
            <div className={styles.vacio}>
              <span>👥</span><p>Sin usuarios aún. ¡Crea el primero!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal nuevo / editar */}
      {modal && (
        <div className={styles.overlay} onClick={cerrar}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{modal === 'nuevo' ? '➕ Nuevo usuario' : '✏️ Editar usuario'}</h2>
              <button className={styles.closBtn} onClick={cerrar}>✕</button>
            </div>

            <div className={styles.modalForm}>
              {modal === 'nuevo' && (
                <div className={styles.campo}>
                  <label className={styles.label}>📧 Correo</label>
                  <input className={styles.input} type="email" placeholder="usuario@correo.com"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              )}

              <div className={styles.campo}>
                <label className={styles.label}>👤 Nombre</label>
                <input className={styles.input} placeholder="Nombre del usuario"
                  value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>

              <div className={styles.campo}>
                <label className={styles.label}>🔑 {modal === 'nuevo' ? 'Contraseña' : 'Nueva contraseña (opcional)'}</label>
                <input className={styles.input} type="password"
                  placeholder={modal === 'nuevo' ? 'Mínimo 6 caracteres' : 'Dejar vacío para no cambiar'}
                  value={passNueva} onChange={e => setPassNueva(e.target.value)} />
              </div>

              <div className={styles.campo}>
                <label className={styles.label}>💳 Plan de suscripción</label>
                <div className={styles.planRow}>
                  {['mensual','anual'].map(p => (
                    <button key={p}
                      className={`${styles.planBtn} ${form.plan === p ? styles.planActivo : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, plan: p }))}>
                      {p === 'mensual' ? '📅 Mensual (30 días)' : '🗓️ Anual (365 días)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.campo}>
                <label className={styles.label}>⚡ Estado</label>
                <div className={styles.planRow}>
                  <button className={`${styles.planBtn} ${form.activo ? styles.planActivo : ''}`}
                    onClick={() => setForm(p => ({ ...p, activo: true }))}>✅ Activo</button>
                  <button className={`${styles.planBtn} ${!form.activo ? styles.planActivoRojo : ''}`}
                    onClick={() => setForm(p => ({ ...p, activo: false }))}>🔒 Inactivo</button>
                </div>
              </div>

              <div className={styles.campo}>
                <label className={styles.label}>📝 Notas internas</label>
                <textarea className={styles.textarea} rows={2} placeholder="Notas del administrador..."
                  value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
              </div>

              {msg && (
                <div className={`${styles.msgBox} ${msg.tipo === 'error' ? styles.msgError : styles.msgOk}`}>
                  {msg.texto}
                </div>
              )}

              <button className={styles.btnGuardar} onClick={modal === 'nuevo' ? guardarNuevo : guardarEditar}
                disabled={saving}>
                {saving ? <span className={styles.spinner} /> : modal === 'nuevo' ? '💾 Crear usuario' : '💾 Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
