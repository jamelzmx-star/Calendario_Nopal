import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './BackupPanel.module.css'

export default function BackupPanel({ onClose }) {
  const { exportar, importar } = useApp()
  const fileRef = useRef()
  const [msg, setMsg] = useState(null)
  const [importing, setImporting] = useState(false)

  const handleImportar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      await importar(file)
      setMsg({ tipo: 'ok', texto: '✅ Datos importados correctamente. Recarga la página.' })
    } catch (err) {
      setMsg({ tipo: 'error', texto: `❌ ${err.message}` })
    }
    setImporting(false)
    e.target.value = ''
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.titulo}>💾 Respaldo de datos</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p className={styles.info}>
          Tus datos se guardan localmente en este dispositivo. Exporta un respaldo para no perderlos si cambias de navegador.
        </p>

        <div className={styles.acciones}>
          <button className={styles.btnExportar} onClick={exportar}>
            <span>⬇️</span>
            <div>
              <div className={styles.btnTitulo}>Exportar respaldo</div>
              <div className={styles.btnSub}>Descarga un archivo .json con todos tus datos</div>
            </div>
          </button>

          <button className={styles.btnImportar} onClick={() => fileRef.current.click()} disabled={importing}>
            <span>⬆️</span>
            <div>
              <div className={styles.btnTitulo}>{importing ? 'Importando...' : 'Importar respaldo'}</div>
              <div className={styles.btnSub}>Restaura datos desde un archivo .json previo</div>
            </div>
          </button>

          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }}
            onChange={handleImportar} />
        </div>

        {msg && (
          <div className={`${styles.msg} ${msg.tipo === 'ok' ? styles.msgOk : styles.msgError}`}>
            {msg.texto}
          </div>
        )}

        <div className={styles.aviso}>
          ⚠️ Al importar se reemplazarán <strong>todos</strong> los datos actuales en este dispositivo.
        </div>
      </div>
    </div>
  )
}
