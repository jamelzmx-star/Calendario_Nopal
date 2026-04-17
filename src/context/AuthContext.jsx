import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

// El email del admin lo defines en .env como VITE_ADMIN_EMAIL
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@tudominio.com'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)   // sesión de Supabase
  const [profile, setProfile] = useState(null)   // fila en tabla profiles
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carga el perfil del usuario desde la tabla profiles
  const cargarPerfil = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) { setProfile(null); return null }
    setProfile(data)
    return data
  }

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) await cargarPerfil(session.user.id)
      setLoading(false)
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, session) => {
      setSession(session)
      if (session?.user) {
        await cargarPerfil(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    setError(null)
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return false }

    // Verificar que el usuario exista y esté activo en profiles
    const perfil = await cargarPerfil(data.user.id)
    setLoading(false)

    if (!perfil) {
      await supabase.auth.signOut()
      setError('Tu cuenta no ha sido habilitada. Contacta al administrador.')
      return false
    }
    if (!perfil.activo) {
      await supabase.auth.signOut()
      setError('Tu cuenta está desactivada. Contacta al administrador.')
      return false
    }
    // Verificar suscripción
    if (perfil.suscripcion_fin) {
      const fin = new Date(perfil.suscripcion_fin)
      if (fin < new Date()) {
        await supabase.auth.signOut()
        setError('Tu suscripción ha vencido. Contacta al administrador.')
        return false
      }
    }
    return true
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const isAdmin = session?.user?.email === ADMIN_EMAIL
  // Usuario puede entrar si tiene sesión, perfil activo y suscripción vigente
  const isAuthorized = !loading && session && profile?.activo

  return (
    <AuthCtx.Provider value={{
      session, profile, loading, error, setError,
      login, logout, isAdmin, isAuthorized,
      recargarPerfil: () => cargarPerfil(session?.user?.id),
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
