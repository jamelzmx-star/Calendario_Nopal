import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, SUPABASE_LISTO } from '../lib/supabase'

const AuthCtx = createContext(null)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@demo.com'

const DEMO_USER    = { id: 'demo-user-001', email: 'demo@nopal.com' }
const DEMO_PROFILE = { id: 'demo-user-001', email: 'demo@nopal.com', nombre: 'Usuario Demo', activo: true, plan: 'mensual', suscripcion_fin: null }

const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) { console.error('Error perfil:', error.message); return null }
    return data
  } catch (e) {
    console.error('Excepción perfil:', e)
    return null
  }
}

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!SUPABASE_LISTO) {
      const saved = sessionStorage.getItem('nopal-demo-session')
      if (saved) { setSession({ user: DEMO_USER }); setProfile(DEMO_PROFILE) }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const p = await getProfile(session.user.id)
        setProfile(p)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Solo actuar en SIGNED_OUT para evitar sobrescribir el perfil
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    setError(null)
    setLoading(true)

    if (!SUPABASE_LISTO) {
      if (email === 'demo@nopal.com' && password === 'demo1234') {
        setSession({ user: DEMO_USER }); setProfile(DEMO_PROFILE)
        sessionStorage.setItem('nopal-demo-session', '1')
        setLoading(false); return true
      }
      setError('Modo demo: usa demo@nopal.com / demo1234')
      setLoading(false); return false
    }

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) {
      setError(authErr.message); setLoading(false); return false
    }

    const perfil = await getProfile(data.user.id)
    console.log('Perfil cargado:', perfil)

    if (!perfil) {
      await supabase.auth.signOut()
      setError('Perfil no encontrado. Ejecuta el INSERT en Supabase SQL Editor.')
      setLoading(false); return false
    }
    if (!perfil.activo) {
      await supabase.auth.signOut()
      setError('Cuenta desactivada. Contacta al administrador.')
      setLoading(false); return false
    }

    setSession(data.session)
    setProfile(perfil)
    setLoading(false)
    return true
  }

  const logout = async () => {
    if (!SUPABASE_LISTO) sessionStorage.removeItem('nopal-demo-session')
    else await supabase.auth.signOut()
    setSession(null); setProfile(null)
  }

  const isAdmin      = session?.user?.email === ADMIN_EMAIL
  const isAuthorized = !loading && !!session && !!profile?.activo

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