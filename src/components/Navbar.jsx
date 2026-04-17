import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/" end className={({ isActive }) => isActive ? `${styles.item} ${styles.active}` : styles.item}>
        <span className={styles.icon}>🏠</span>
        <span className={styles.label}>Inicio</span>
      </NavLink>
      <NavLink to="/entregas" className={({ isActive }) => isActive ? `${styles.item} ${styles.active}` : styles.item}>
        <span className={styles.icon}>📋</span>
        <span className={styles.label}>Entregas</span>
      </NavLink>
      <NavLink to="/nueva" className={({ isActive }) => isActive ? `${styles.itemCenter} ${styles.activeCenter}` : styles.itemCenter}>
        <span className={styles.iconCenter}>＋</span>
      </NavLink>
      <NavLink to="/calendario" className={({ isActive }) => isActive ? `${styles.item} ${styles.active}` : styles.item}>
        <span className={styles.icon}>📅</span>
        <span className={styles.label}>Calendario</span>
      </NavLink>
      <NavLink to="/graficas" className={({ isActive }) => isActive ? `${styles.item} ${styles.active}` : styles.item}>
        <span className={styles.icon}>📊</span>
        <span className={styles.label}>Gráficas</span>
      </NavLink>
    </nav>
  )
}
