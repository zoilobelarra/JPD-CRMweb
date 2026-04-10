# GestorDB — Guía de instalación y despliegue

Aplicación web completa para gestionar registros con búsqueda instantánea, filtros, ordenación e impresión de informes.

---

## 🏗️ Stack tecnológico

- **Frontend**: Next.js 14 (React)
- **Base de datos**: Supabase (PostgreSQL)
- **Despliegue**: Vercel

---

## 📋 Paso 1 — Configurar Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com) (gratis)
2. Crea un **nuevo proyecto**
3. Ve a **SQL Editor** y ejecuta el contenido de `supabase_schema.sql`
4. Esto creará las tablas `catalogos` y `registros`, con datos de ejemplo

### Obtener las credenciales

Ve a tu proyecto Supabase → **Settings → API**

Anota:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Row Level Security (RLS)

Para desarrollo rápido, desactiva RLS en ambas tablas:
- Ve a **Authentication → Policies**
- En `registros` y `catalogos`, desactiva RLS o añade una política "Allow all"

Para producción, configura autenticación y políticas adecuadas.

---

## 💻 Paso 2 — Ejecutar en local

```bash
# Clonar o descomprimir el proyecto
cd gestordb

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 🚀 Paso 3 — Desplegar en Vercel

### Opción A — Desde GitHub (recomendado)

1. Sube el proyecto a un repositorio GitHub
2. Ve a [vercel.com](https://vercel.com) y crea una cuenta
3. Haz clic en **"New Project"** → importa tu repositorio
4. En **"Environment Variables"** añade:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key
5. Haz clic en **"Deploy"**

### Opción B — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel

# En producción:
vercel --prod
```

Al desplegar, Vercel te pedirá las variables de entorno.

---

## 📁 Estructura del proyecto

```
gestordb/
├── components/
│   ├── CatalogModal.js    # Gestión de catálogos (acciones/estados/responsables)
│   ├── ConfirmModal.js    # Diálogo de confirmación de borrado
│   ├── RecordModal.js     # Formulario crear/editar registro
│   └── Toast.js           # Notificaciones emergentes
├── lib/
│   └── supabase.js        # Cliente Supabase
├── pages/
│   ├── _app.js
│   └── index.js           # Página principal con toda la lógica
├── styles/
│   └── globals.css        # Estilos globales
├── supabase_schema.sql    # Schema SQL para ejecutar en Supabase
├── .env.example           # Plantilla de variables de entorno
├── next.config.js
├── package.json
└── vercel.json
```

---

## ✨ Funcionalidades

| Función | Descripción |
|---------|-------------|
| 🔍 Búsqueda instantánea | Filtra en todos los campos simultáneamente mientras escribes |
| 🏷️ Filtros | Por acción, estado, responsable y rango de fechas |
| ↕️ Ordenación | Por fecha, acción, estado, responsable o descripción (asc/desc) |
| ➕ Crear | Formulario modal para nuevos registros |
| ✏️ Editar | Edición inline en modal |
| 🗑️ Borrar | Con confirmación para evitar accidentes |
| ⚙️ Catálogos | Gestión de los valores de acción, estado y responsable |
| 🖨️ Imprimir | Informe imprimible con los datos filtrados actualmente |

---

## 🔧 Personalización

### Añadir más campos a la tabla

1. Añade la columna en Supabase: `ALTER TABLE registros ADD COLUMN nuevo_campo TEXT`
2. Actualiza el formulario en `components/RecordModal.js`
3. Añade la columna en la tabla de `pages/index.js`
4. Incluye el campo en la búsqueda de texto

### Cambiar colores/tema

Edita las variables CSS en `styles/globals.css` (sección `:root`)

---

## 🛠️ Soporte

Si encuentras algún problema, revisa:
1. Que las variables de entorno estén correctamente configuradas
2. Que el SQL se haya ejecutado correctamente en Supabase
3. Que RLS esté desactivado o configurado con políticas adecuadas
