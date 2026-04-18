import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const { login, loading, error, setError, modoDemo } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(modoDemo ? 'demo@nopal.com' : '')
  const [pass,  setPass]  = useState(modoDemo ? 'demo1234' : '')
  const [show,  setShow]  = useState(false)
  const [local, setLocal] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocal(true)
    setError(null)
    const ok = await login(email.trim(), pass)
    setLocal(false)
    if (ok) navigate('/')
  }

  const busy = loading || local

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <span className={styles.n1}>🌵</span>
        <span className={styles.n2}>🌵</span>
      </div>

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <span className={styles.logo}>🌵</span>
          <h1 className={styles.titulo}>Control Nopal</h1>
          <p className={styles.sub}>Inicia sesión para continuar</p>
        </div>

        {modoDemo && (
          <div className={styles.demoBanner}>
            <strong>⚡ Modo demo</strong><br/>
            demo@nopal.com / demo1234
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.campo}>
            <label className={styles.label}>📧 Correo electrónico</label>
            <input
              className={styles.input}
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              disabled={busy}
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label}>🔒 Contraseña</label>
            <div className={styles.passWrap}>
              <input
                className={styles.input}
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
              />
              <button type="button" className={styles.eyeBtn}
                onClick={() => setShow(v => !v)}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>⚠️ {error}</div>
          )}

          <button type="submit" className={styles.btnLogin} disabled={busy}>
            {busy ? <span className={styles.spinner} /> : '🚪 Entrar'}
          </button>
        </form>

        <p className={styles.footer}>
          {modoDemo
            ? 'Configura .env para conectar Supabase'
            : '¿Sin cuenta? Contacta al administrador.'}
        </p>
      </div>
    </div>
  )
}