import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NuevaEntrega from './pages/NuevaEntrega'
import ListaEntregas from './pages/ListaEntregas'
import EditarEntrega from './pages/EditarEntrega'
import Notificaciones from './pages/Notificaciones'
import Calendario from './pages/Calendario'
import Graficas from './pages/Graficas'
import Admin from './pages/Admin'
import './index.css'

function Loading() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#faf6ee' }}>
      <span style={{ fontSize:'3rem' }}>🌵</span>
      <div style={{ width:30, height:30, border:'3px solid #d8f0cc', borderTopColor:'#2d6a18', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// Pantalla de error cuando el perfil no se cargó
function SinPerfil({ email, onLogout }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#faf6ee', padding:24, textAlign:'center' }}>
      <span style={{ fontSize:'3rem' }}>⚠️</span>
      <h2 style={{ fontFamily:'Fraunces,serif', fontSize:'1.4rem', color:'#1a3a0a' }}>Perfil no encontrado</h2>
      <p style={{ fontSize:'.9rem', color:'#7a5c3e', maxWidth:320, lineHeight:1.6 }}>
        El usuario <strong>{email}</strong> no tiene un perfil en la base de datos, o está desactivado.
      </p>
      <div style={{ background:'#f5e6c8', borderRadius:12, padding:'14px 18px', fontSize:'.82rem', color:'#6b3a1f', maxWidth:380, lineHeight:1.7, textAlign:'left' }}>
        <strong>Solución:</strong> Ve a Supabase → SQL Editor y ejecuta:<br/>
        <code style={{ display:'block', marginTop:8, background:'rgba(0,0,0,.07)', padding:'6px 10px', borderRadius:6, fontSize:'.78rem' }}>
          INSERT INTO public.profiles (id, email, nombre, activo, plan, suscripcion_fin)<br/>
          VALUES ('TU-UUID', '{email}', 'Admin', true, 'anual', NOW() + INTERVAL '365 days');
        </code>
      </div>
      <button onClick={onLogout} style={{ marginTop:8, background:'#2d6a18', color:'#fff', padding:'10px 24px', borderRadius:12, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        🚪 Cerrar sesión
      </button>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthorized, loading, session, profile, logout } = useAuth()
  if (loading) return <Loading />
  // Logueado pero sin perfil válido → mostrar ayuda en vez de blanco
  if (session && !profile?.activo) {
    return <SinPerfil email={session.user.email} onLogout={logout} />
  }
  if (!isAuthorized) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { isAdmin, loading, session } = useAuth()
  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function WithNav({ children }) {
  return <>{children}<Navbar /></>
}

function AppRoutes() {
  const { session } = useAuth()
  const userId = session?.user?.id

  return (
    <AppProvider userId={userId}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/" element={<ProtectedRoute><WithNav><Dashboard /></WithNav></ProtectedRoute>} />
          <Route path="/nueva" element={<ProtectedRoute><WithNav><NuevaEntrega /></WithNav></ProtectedRoute>} />
          <Route path="/entregas" element={<ProtectedRoute><WithNav><ListaEntregas /></WithNav></ProtectedRoute>} />
          <Route path="/editar/:id" element={<ProtectedRoute><WithNav><EditarEntrega /></WithNav></ProtectedRoute>} />
          <Route path="/notificaciones" element={<ProtectedRoute><WithNav><Notificaciones /></WithNav></ProtectedRoute>} />
          <Route path="/calendario" element={<ProtectedRoute><WithNav><Calendario /></WithNav></ProtectedRoute>} />
          <Route path="/graficas" element={<ProtectedRoute><WithNav><Graficas /></WithNav></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
