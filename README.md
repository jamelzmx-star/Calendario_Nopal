# Enlace 🌵 Control Nopal
https://jamelzmx-star.github.io/Calendario_Nopal/#/login

# 🌵 Control Nopal

App móvil para gestión de entregas y cobros de nopal, con **login via Supabase** y panel de administración.

---

## ✨ Funcionalidades

|       Sección     |      Descripción         |
|-------------------|------------------------------------------------------------------------|
| 🔐 Login         | Autenticación con email/contraseña via Supabase                 |
| 🏠 Dashboard     | Resumen de cobros, botón de menú con logout y respaldo           |
| ➕ Nueva entrega | Multi-categoría con precio variable por categoría                |
| 📋 Lista         | Filtros, búsqueda, expandir categorías                           |
| ✏️ Editar        | Modificar categorías, marcar pagado, eliminar                    |
| 🔔 Recordatorios | Recordatorios automáticos de cobro pendiente                     |
| 📅 Calendario    | Vista mensual con entregas por día                               |
| 📈 Gráficas      | Ganancias semanales y mensuales                                  |
| 💾 Respaldo      | Exportar/importar datos en JSON                                  |
| ⚙️ Panel Admin   | Solo el admin: crear usuarios, activar/desactivar, suscripciones |

**Datos:** se guardan localmente en `localStorage` por usuario (aislados).  
**Auth:** sesión gestionada por Supabase. El perfil (activo/suscripción) se valida en cada login.

---

## 🚀 Configuración paso a paso

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Guarda tu **Project URL** y **anon/public key** (Settings → API)

### 2. Crear la tabla `profiles`

En Supabase Dashboard → **SQL Editor** → pega y ejecuta el contenido de `supabase_migration.sql`

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env`:
```env
VITE_SUPABASE_URL=https://XXXXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ADMIN_EMAIL=tu@correo.com
```

> ⚠️ `.env` nunca se sube a Git (ya está en `.gitignore`)

### 4. Crear tu usuario admin en Supabase

En Supabase → **Authentication → Users → Add user**:
- Email: el mismo que pusiste en `VITE_ADMIN_EMAIL`
- Password: la que quieras
- ✅ "Auto Confirm User"

Luego en **SQL Editor** inserta su perfil:
```sql
INSERT INTO profiles (id, email, nombre, activo, plan, suscripcion_fin)
VALUES (
  'EL-UUID-DEL-USUARIO',   -- cópialo de Authentication > Users
  'tu@correo.com',
  'Administrador',
  true,
  'anual',
  NOW() + INTERVAL '365 days'
);
```

### 5. Crear usuarios desde el panel admin

1. Inicia sesión con tu cuenta admin
2. La app te lleva al Dashboard → menú `⋯` → **Panel Admin**
3. Click en **➕ Nuevo usuario**
4. Llena email, contraseña, nombre, plan (mensual/anual)
5. El sistema crea el usuario en Supabase Auth + inserta su perfil activo

---

## 💻 Desarrollo local

```bash
npm install
npm run dev
```

> Necesitas el archivo `.env` con tus claves de Supabase.

---

## 🚀 Deploy en GitHub Pages

```bash
# 1. Cambia tu usuario en package.json:
#    "homepage": "https://TU-USUARIO.github.io/Calendario_Nopal"

# 2. Sube a GitHub
git init && git add . && git commit -m "🌵 Control Nopal"
git remote add origin https://github.com/TU-USUARIO/Calendario_Nopal.git
git push -u origin main

# 3. Despliega
npm run deploy
```

En GitHub → **Settings → Pages** → Branch: `gh-pages` / `root`

> ⚠️ Las variables `VITE_*` se embeben en el build. Para GitHub Pages necesitas hacer el build con el `.env` local y luego hacer `deploy`. Las claves anon de Supabase son públicas por diseño.

---

## 🗂️ Estructura del proyecto

```
src/
├── context/
│   ├── AppContext.jsx      # Estado local (entregas por userId)
│   └── AuthContext.jsx     # Sesión Supabase + validación perfil
├── lib/
│   └── supabase.js         # Cliente Supabase
├── components/
│   ├── Navbar.jsx
│   ├── CategoriasEditor.jsx
│   └── BackupPanel.jsx     # Exportar / Importar JSON
├── pages/
│   ├── Login.jsx           # Pantalla de login
│   ├── Dashboard.jsx       # Inicio + menú usuario
│   ├── NuevaEntrega.jsx
│   ├── ListaEntregas.jsx
│   ├── EditarEntrega.jsx
│   ├── Notificaciones.jsx
│   ├── Calendario.jsx
│   ├── Graficas.jsx
│   └── Admin.jsx           # Panel de administración
├── App.jsx                 # Rutas + guards auth
└── index.css
supabase_migration.sql      # SQL para crear tabla profiles
.env.example                # Plantilla de variables
```

---

## 🔒 Flujo de acceso

```
Usuario abre la app
       ↓
  ¿Tiene sesión?  ──No──→  Pantalla Login
       ↓ Sí
  Supabase valida email + password
       ↓
  Se carga perfil desde tabla profiles
       ↓
  ¿Perfil existe y activo = true?  ──No──→  Mensaje + logout
       ↓ Sí
  ¿Suscripción vigente?  ──No──→  Mensaje + logout
       ↓ Sí
  Accede al Dashboard
       ↓
  ¿Email = VITE_ADMIN_EMAIL?  ──Sí──→  Menú Admin disponible
```

---

## 🛠️ Stack

- React 19 + Vite 8
- React Router DOM v7
- Supabase JS v2
- Recharts
- CSS Modules
- gh-pages
