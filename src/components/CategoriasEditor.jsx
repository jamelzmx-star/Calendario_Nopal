import styles from './CategoriasEditor.module.css'

const newCat = () => ({ id: Date.now() + Math.random(), nombre: '', cajas: '', precio: '' })

export default function CategoriasEditor({ categorias, onChange }) {
  const subtotal = (c) => (Number(c.cajas) || 0) * (Number(c.precio) || 0)

  const update = (id, campo, val) =>
    onChange(categorias.map(c => c.id === id ? { ...c, [campo]: val } : c))

  const agregar = () => onChange([...categorias, newCat()])

  const eliminar = (id) => {
    if (categorias.length === 1) return
    onChange(categorias.filter(c => c.id !== id))
  }

  return (
    <div className={styles.wrap}>
      {/* Encabezados */}
      <div className={styles.cabecera}>
        <span className={styles.colNombre}>Categoría</span>
        <span className={styles.colNum}>Cajas</span>
        <span className={styles.colNum}>Precio</span>
        <span className={styles.colSub}>Subtotal</span>
        <span className={styles.colDel} />
      </div>

      {/* Filas */}
      {categorias.map((c, i) => (
        <div key={c.id} className={styles.fila} style={{ animationDelay: `${i * 0.05}s` }}>
          <input
            className={`${styles.inp} ${styles.inpNombre}`}
            placeholder="Ej: Nopal grande"
            value={c.nombre}
            onChange={e => update(c.id, 'nombre', e.target.value)}
          />
          <input
            className={`${styles.inp} ${styles.inpNum}`}
            type="number"
            inputMode="numeric"
            placeholder="0"
            min="0"
            value={c.cajas}
            onChange={e => update(c.id, 'cajas', e.target.value)}
          />
          <div className={styles.precioWrap}>
            <span className={styles.peso}>$</span>
            <input
              className={`${styles.inp} ${styles.inpNum} ${styles.inpPrecio}`}
              type="number"
              inputMode="decimal"
              placeholder="0"
              min="0"
              step="0.5"
              value={c.precio}
              onChange={e => update(c.id, 'precio', e.target.value)}
            />
          </div>
          <div className={`${styles.sub} ${subtotal(c) > 0 ? styles.subActivo : ''}`}>
            ${(subtotal(c)).toLocaleString('es-MX')}
          </div>
          <button
            className={`${styles.btnDel} ${categorias.length === 1 ? styles.btnDelDisabled : ''}`}
            onClick={() => eliminar(c.id)}
            disabled={categorias.length === 1}
          >✕</button>
        </div>
      ))}

      {/* Botón agregar */}
      <button className={styles.btnAgregar} onClick={agregar}>
        <span className={styles.btnAgregarIcon}>＋</span>
        Agregar categoría
      </button>

      {/* Total parcial si hay más de 1 fila */}
      {categorias.length > 1 && (
        <div className={styles.resumen}>
          <span>📦 {categorias.reduce((s, c) => s + (Number(c.cajas)||0), 0)} cajas</span>
          <span className={styles.resumenTotal}>
            = ${categorias.reduce((s, c) => s + (Number(c.cajas)||0)*(Number(c.precio)||0), 0).toLocaleString('es-MX')}
          </span>
        </div>
      )}
    </div>
  )
}
