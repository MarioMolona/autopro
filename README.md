# AutoPro

Kanban para gestionar el flujo de contenido y las tareas de Mario y sus agentes (Cinder, Odette). Aplicación web React + Vite con Supabase como backend (Postgres, Auth, Realtime y Web Push). Instalable como PWA.

> Antes se llamó *ContentFlow Pro*. El SRS original vive en [`Documento de Especificación de Requerimientos.md`](./Documento%20de%20Especificación%20de%20Requerimientos.md), pero describe módulos que aún no están implementados: **la fuente de verdad es el código y la base real**, no el documento.

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19, Vite 6, CSS propio (design tokens) |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable` |
| Iconos | `lucide-react` |
| Backend | Supabase: Postgres, Auth, Realtime, Edge Functions, Web Push |
| PWA | `public/manifest.json` + `public/sw.js` (service worker) |

## Funcionalidad

- **Tablero Kanban** con columnas reordenables y arrastrar-y-soltar tarjetas.
- **Tarjetas** con descripción, prioridad, fecha límite, etiquetas, responsables, subtareas, comentarios y adjuntos.
- **Usuarios y roles** (`Administrador`, `Usuario`, `Espectador`) más agentes de IA (`isAiAgent`), con avatar y perfil.
- **Vista de dashboard** con resumen del tablero.
- **Búsqueda y filtros** dentro del tablero.
- **Tiempo real**: los cambios en `cards` y `columns` se reflejan al instante vía Supabase Realtime.
- **Notificaciones**: avisos por columna, preferencias por usuario y push del navegador.
- **Historial y auditoría**: `activity_log` y `audit_log` se llenan por disparadores en la base, no desde el frontend.

## Puesta en marcha

Requisitos: Node 18+ y un proyecto de Supabase.

```bash
git clone git@github.com:MarioMolona/autopro.git
cd autopro
npm install
```

1. Crea `.env` a partir de `.env.example`:

   ```
   VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

   Solo se usa la llave **publishable** en el frontend. La `service_role` nunca entra al repo ni al bundle.

2. Aplica el esquema en el SQL Editor de Supabase (o con `supabase db push`):

   ```
   supabase/migrations/001_esquema_base.sql
   ```

3. (Opcional) Datos de ejemplo:

   ```bash
   npm run seed:check   # verifica conexión y credenciales, sin escribir nada
   npm run seed         # inserta los datos de ejemplo
   ```

   El seed lee las mismas variables del `.env`. Si falla por permisos (RLS), ejecútalo con una sesión autenticada o desde el servidor con la llave secreta en un archivo aparte que nunca se commitea.

4. Arranca:

   ```bash
   npm run dev      # http://localhost:5173
   npm run build    # build de producción en dist/
   npm run preview  # sirve el build
   ```

## Estructura

```
src/
  App.jsx                  # rutas con AuthProvider → Login o Tablero
  components/
    board/                 # KanbanBoard, KanbanColumn, KanbanCard, modales
    dashboard/             # DashboardOverview
    layout/                # AppLayout, Header, Sidebar, SubNav, modales
    ui/                    # Button, Badge, Modal, Avatar, ImageCropper
  context/
    AuthContext.jsx        # sesión de Supabase, perfil de usuario, notificaciones
    BoardContext.jsx       # columnas, tarjetas, etiquetas, comentarios + Realtime
    ViewContext.jsx        # vista activa y filtros
  data/mockData.js         # datos de ejemplo para el seed
  pages/                   # BoardPage, LoginPage
  styles/                  # tokens.css y global.css
  utils/                   # supabase.js, push.js, imageUtils.js
public/
  manifest.json, sw.js, icon.svg
supabase/migrations/       # SQL versionado
```

## Convención de esquema — no mezclar estilos

- **Tablas en `snake_case`**: `cards`, `card_assignees`, `card_labels`, `labels`, `comments`, `notifications`, `push_subscriptions`, `notification_prefs`, `activity_log`, `audit_log`.
- **Columnas en `camelCase`**: `"columnId"`, `"createdAt"`, `"createdBy"`, `"updatedAt"`, `"isAiAgent"`, `"notifyOnEnter"`.
- Los **adjuntos no son tabla**: son arreglos dentro de `cards.attachments` y `comments.attachments`.
- Los **IDs no son UUID**: son texto con prefijo (`card-004`, `usr-001`, `col-002`). No asumir UUID en claves foráneas.
- `users.id` **no** está ligado a `auth.uid()`: la app empareja el usuario por email en `AuthContext`.

Antes de tocar esquema, audita la base real con la `service_role`; el SRS y el catálogo mienten.

## Estado y pendientes

Implementado: capa de datos real, migración 001, Realtime, preferencias por columna, historial/auditoría y push con PWA.

Pendiente:

- Migración 002: permisos finos por rol (requiere ligar `users.id` a `auth.uid()`).
- Tokens propios por agente para que Cinder y Odette operen como usuarios `isAiAgent`.
- `activity_log` y `audit_log` visibles solo para administradores.
- Página de ajustes de notificaciones por columna en la UI.

## Notas de seguridad

- Las llaves viven en variables de entorno; `.env` está en `.gitignore` y en el servidor tiene permisos `600`.
- Ningún archivo del repo lleva URL ni llaves hardcodeadas.
- La clave pública VAPID se obtiene desde la Edge Function `get-vapid-public-key`, no se hornea en el bundle.
- `seed.js` rechaza arrancar si detecta una llave secreta: solo acepta la publishable.

## Agentes

AutoPro es la **fuente de verdad de tareas**. Cinder orquesta: crea la tarjeta → llama al motor (ComfyUI por API/MCP) → adjunta el resultado → mueve la tarjeta a Revisión → avisa por push. Cada agente debe operar con su propio usuario y token, nunca con la cuenta de Mario.
