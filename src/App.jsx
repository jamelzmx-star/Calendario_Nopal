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

// Rutas protegidas: redirige a /login si no hay sesión activa
function ProtectedRoute({ children }) {
  const { isAuthorized, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthorized) return <Navigate to="/login" replace />
  return children
}

// Rutas solo para admin
function AdminRoute({ children }) {
  const { isAdmin, loading, session } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, background: 'var(--crema)'
    }}>
      <span style={{ fontSize: '3rem' }}>🌵</span>
      <div style={{
        width: 32, height: 32,
        border: '3px solid rgba(45,106,24,0.2)',
        borderTop: '3px solid var(--verde-nopal)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// App interna (tiene acceso a useAuth)
function AppRoutes() {
  const { session } = useAuth()
  const userId = session?.user?.id

  return (
    <AppProvider userId={userId}>
      <HashRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Admin (no requiere perfil activo, solo ser el admin email) */}
          <Route path="/admin" element={
            <AdminRoute><Admin /></AdminRoute>
          } />

          {/* App principal protegida */}
          <Route path="/" element={<ProtectedRoute><><Dashboard /><Navbar /></></ProtectedRoute>} />
          <Route path="/nueva" element={<ProtectedRoute><><NuevaEntrega /><Navbar /></></ProtectedRoute>} />
          <Route path="/entregas" element={<ProtectedRoute><><ListaEntregas /><Navbar /></></ProtectedRoute>} />
          <Route path="/editar/:id" element={<ProtectedRoute><><EditarEntrega /><Navbar /></></ProtectedRoute>} />
          <Route path="/notificaciones" element={<ProtectedRoute><><Notificaciones /><Navbar /></></ProtectedRoute>} />
          <Route path="/calendario" element={<ProtectedRoute><><Calendario /><Navbar /></></ProtectedRoute>} />
          <Route path="/graficas" element={<ProtectedRoute><><Graficas /><Navbar /></></ProtectedRoute>} />

          {/* Fallback */}
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
