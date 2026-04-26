import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, SUPABASE_LISTO } from '../lib/supabase'

const AuthCtx = createContext(null)
const ADMIN_EMAIL  = import.meta.env.VITE_ADMIN_EMAIL || ''
const REMEMBER_KEY = 'nopal-remember-email'

const DEMO_USER    = { id: 'demo-001', email: 'demo@nopal.com' }
const DEMO_PROFILE = { id: 'demo-001', email: 'demo@nopal.com', nombre: 'Demo', activo: true, plan: 'mensual', suscripcion_fin: null }

const fetchProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) { console.warn('fetchProfile error:', error.message); return null }
    return data
  } catch (e) {
    console.warn('fetchProfile exception:', e)
    return null
  }
}

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  // ── Inicializar sesión al cargar/recargar ────────────────────────
  useEffect(() => {
    if (!SUPABASE_LISTO) {
      if (sessionStorage.getItem('nopal-demo')) {
        setSession({ user: DEMO_USER })
        setProfile(DEMO_PROFILE)
      }
      setLoading(false)
      return
    }

    // Cargar sesión existente (incluye recargas de página)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session)
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      }
      setLoading(false)
    }).catch(() => setLoading(false))

    // Solo escuchar SIGNED_OUT para no interferir con el flujo de login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Login ────────────────────────────────────────────────────────
  const login = async (email, password, recordar = false) => {
    setError(null)

    // Modo demo
    if (!SUPABASE_LISTO) {
      if (email === 'demo@nopal.com' && password === 'demo1234') {
        setSession({ user: DEMO_USER })
        setProfile(DEMO_PROFILE)
        sessionStorage.setItem('nopal-demo', '1')
        if (recordar) localStorage.setItem(REMEMBER_KEY, email)
        else localStorage.removeItem(REMEMBER_KEY)
        return true
      }
      setError('Modo demo: usa demo@nopal.com / demo1234')
      return false
    }

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) { setError(authErr.message); return false }

    // Guardar o limpiar email recordado
    if (recordar) localStorage.setItem(REMEMBER_KEY, email)
    else localStorage.removeItem(REMEMBER_KEY)

    const perfil = await fetchProfile(data.user.id)

    if (!perfil) {
      await supabase.auth.signOut()
      setError('Perfil no encontrado. Ejecuta el INSERT en Supabase SQL Editor.')
      return false
    }
    if (!perfil.activo) {
      await supabase.auth.signOut()
      setError('Cuenta desactivada. Contacta al administrador.')
      return false
    }

    setSession(data.session)
    setProfile(perfil)
    return true
  }

  // ── Logout ───────────────────────────────────────────────────────
  const logout = async () => {
    if (!SUPABASE_LISTO) sessionStorage.removeItem('nopal-demo')
    else await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const isAdmin      = session?.user?.email === ADMIN_EMAIL
  const isAuthorized = !loading && !!session && !!profile

  // Email recordado para login rápido
  const emailRecordado = localStorage.getItem(REMEMBER_KEY) || ''

  return (
    <AuthCtx.Provider value={{
      session, profile, loading, error, setError,
      login, logout, isAdmin, isAuthorized,
      modoDemo: !SUPABASE_LISTO,
      emailRecordado,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
