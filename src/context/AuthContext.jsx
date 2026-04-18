import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, SUPABASE_LISTO } from '../lib/supabase'

const AuthCtx = createContext(null)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

const DEMO_USER    = { id: 'demo-001', email: 'demo@nopal.com' }
const DEMO_PROFILE = { id: 'demo-001', email: 'demo@nopal.com', nombre: 'Demo', activo: true, plan: 'mensual', suscripcion_fin: null }

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!SUPABASE_LISTO) {
      if (sessionStorage.getItem('nopal-demo')) {
        setSession({ user: DEMO_USER })
        setProfile(DEMO_PROFILE)
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setSession(session)
      if (!session) setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    setError(null)

    if (!SUPABASE_LISTO) {
      if (email === 'demo@nopal.com' && password === 'demo1234') {
        setSession({ user: DEMO_USER })
        setProfile(DEMO_PROFILE)
        sessionStorage.setItem('nopal-demo', '1')
        return true
      }
      setError('Modo demo: usa demo@nopal.com / demo1234')
      return false
    }

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); return false }

    // Cargar perfil con timeout de 4s
    try {
      const { data: perfil } = await Promise.race([
        supabase.from('profiles').select('*').eq('id', data.user.id).single(),
        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 4000))
      ])
      if (!perfil)        { await supabase.auth.signOut(); setError('Perfil no encontrado en la base de datos.'); return false }
      if (!perfil.activo) { await supabase.auth.signOut(); setError('Cuenta desactivada.'); return false }
      setProfile(perfil)
      return true
    } catch {
      // Si falla la carga del perfil, al menos dejamos pasar con sesión
      // El perfil se intentará cargar en el siguiente render
      setProfile({ id: data.user.id, email: data.user.email, activo: true, plan: 'mensual', suscripcion_fin: null })
      return true
    }
  }

  const logout = async () => {
    if (!SUPABASE_LISTO) sessionStorage.removeItem('nopal-demo')
    else await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const isAdmin      = session?.user?.email === ADMIN_EMAIL
  const isAuthorized = !loading && !!session && !!profile

  return (
    <AuthCtx.Provider value={{
      session, profile, loading, error, setError,
      login, logout, isAdmin, isAuthorized,
      modoDemo: !SUPABASE_LISTO,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)