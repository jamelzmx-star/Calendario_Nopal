import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const { login, loading, error, setError } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    await login(email.trim(), pass)
  }

  return (
    <div className={styles.page}>
      {/* Fondo decorativo */}
      <div className={styles.bg}>
        <span className={styles.nopal1}>🌵</span>
        <span className={styles.nopal2}>🌵</span>
        <span className={styles.nopal3}>🌿</span>
      </div>

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <span className={styles.logo}>🌵</span>
          <h1 className={styles.titulo}>Control Nopal</h1>
          <p className={styles.sub}>Inicia sesión para continuar</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.campo}>
            <label className={styles.label}>📧 Correo electrónico</label>
            <input
              className={styles.input}
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label}>🔒 Contraseña</label>
            <div className={styles.passWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.btnLogin}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : '🚪 Entrar'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿No tienes cuenta? Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
