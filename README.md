# Plataforma de Recibos Digitales y Nómina Administrativa

Plataforma web empresarial profesional desarrollada con **Next.js (App Router), TypeScript, Tailwind CSS y Supabase (PostgreSQL + RLS)** para la administración de organizaciones, directorio de personas y emisión de recibos digitales personalizables con cálculo automático, impresión en tamaño Carta/A4 horizontal, exportación a PDF y validación pública mediante código QR.

---

## 🌟 Características Principales

1. **Plantilla Digital de Alta Fidelidad**:
   - Recreación 100% en HTML y CSS del diseño corporativo de nómina con corte poligonal diagonal en el encabezado (`clip-path`).
   - Bloque de identificación de la empresa, eslogan, datos de emisión y folio.
   - Directorio de colaboradores con cargos, departamento, RFC y régimen de contratación.
   - Tablas de Percepciones y Deducciones con desglose, referencias e importes.
   - Tarjeta destacada de Neto a Pagar con cálculo automático.
   - Sección de Pago (banco, método, fecha y cuenta enmascarada a los últimos 4 dígitos).
   - Módulo de Validación con **Código QR escaneable**, folio interno y código alfanumérico.
   - Firma digitalizada del representante y aviso legal de comprobante administrativo interno.
   - Pie de página oscuro con iconos de dirección, teléfono, WhatsApp, correo y web.

2. **Editor Split-Screen en Tiempo Real**:
   - Formulario por secciones a la izquierda y vista previa fidedigna a la derecha.
   - Adición, edición y eliminación de conceptos de percepción y deducción en caliente.
   - Recálculo matemático inmediato de totales y neto sin números flotantes imprecisos.
   - Alerta visual automática si las deducciones superan las percepciones.

3. **Impresión y Exportación a PDF**:
   - Estilos CSS `@media print` calibrados al milímetro para hojas tamaño Carta y A4 horizontal sin cortes de tabla ni botones visibles.
   - Botón de descarga directa en formato `.pdf` con nomenclatura estandarizada: `RECIBO_[EMPRESA]_[FOLIO]_[PERSONA].pdf`.

4. **Validación QR Segura y Enlaces Temporales**:
   - Código QR que redirige a `/validate/[codigo]` para verificar validez y folio sin exponer datos bancarios ni información confidencial.
   - Generación de enlaces temporales (`/share/[token]`) con vigencia configurable y revocación inmediata.

5. **Multiempresa y Seguridad**:
   - Soporte para múltiples empresas con selector rápido de empresa activa.
   - Personalizador visual de colores (Primario, Secundario, Acento), logotipo, firma y prefijo de folios.
   - Directorio de personas con roles (Trabajador, Colaborador, Usuario, Cliente, Proveedor, Otro).
   - Generación de folios consecutivos segura.
   - Script SQL de migración para Supabase con políticas **Row Level Security (RLS)**.

---

## 🚀 Requisitos Previos

- **Node.js** v18.17 o superior (probado en Node.js v24 en macOS).
- **npm** v9 o superior.

---

## 📦 Instalación y Ejecución Local en macOS

### 1. Clonar o acceder al proyecto
```bash
cd "/Users/eliasespinoza/Documents/antigravity/Nuevo 2"
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de Entorno (Opcional)
Copia el archivo de ejemplo para configurar Supabase cuando lo desees:
```bash
cp .env.example .env.local
```

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000) para interactuar con la plataforma.

---

## 🗄️ Configuración de Supabase y PostgreSQL

La plataforma incluye el script de migración SQL completo en:
`supabase/migrations/20260819_initial_schema.sql`

Para conectarlo a tu proyecto de Supabase:
1. Crea un nuevo proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** en el panel de Supabase.
3. Copia y pega el contenido del archivo `supabase/migrations/20260819_initial_schema.sql` y ejecútalo.
4. En **Project Settings > API**, copia la `URL` y la `anon key`.
5. Colócalas en tu archivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

---

## 🌐 Despliegue en Vercel

1. Sube tu repositorio a GitHub / GitLab.
2. Inicia sesión en [Vercel](https://vercel.com) e importa el repositorio.
3. En la sección **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (la URL de producción de Vercel)
4. Haz clic en **Deploy**.

---

## 🧪 Comandos de Validación y Compilación

- **Ejecutar Linter**: `npm run lint`
- **Compilar para Producción**: `npm run build`
- **Iniciar Servidor de Producción**: `npm run start`

---

## ⚖️ Aviso Legal
*Este sistema está diseñado para la emisión de comprobantes y recibos administrativos internos y no sustituye un CFDI de nómina fiscal timbrado ante el SAT.*
