# Documento de Especificación de Requerimientos
### Software Requirements Specification (SRS)

# ContentFlow Pro
**Aplicación Web de Gestión Kanban para Preproducción de Contenido en Video**

---

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Fecha** | Marzo 2026 |
| **Estado** | Borrador — Para Revisión |
| **Plataforma objetivo** | Web (Google Antigravity) |
| **Base de datos** | Supabase (PostgreSQL) |
| **Autenticación** | Supabase Auth |

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Descripción General del Sistema](#2-descripción-general-del-sistema)
3. [Requerimientos Funcionales](#3-requerimientos-funcionales)
4. [Requerimientos No Funcionales](#4-requerimientos-no-funcionales)
5. [Arquitectura del Sistema](#5-arquitectura-del-sistema)
6. [Flujo de Trabajo del Contenido — Columnas Kanban](#6-flujo-de-trabajo-del-contenido--columnas-kanban)
7. [Casos de Uso Principales](#7-casos-de-uso-principales)
8. [Restricciones y Supuestos](#8-restricciones-y-supuestos)
- [Apéndice A: Resumen de Requerimientos por Módulo](#apéndice-a-resumen-de-requerimientos-por-módulo)

---

## 1. Introducción

### 1.1 Propósito del Documento

Este documento describe los requerimientos funcionales y no funcionales del sistema **ContentFlow Pro**, una aplicación web tipo Kanban diseñada para gestionar el flujo de preproducción de piezas de contenido en video. El documento sirve como referencia técnica para el equipo de desarrollo, diseño, QA y stakeholders.

### 1.2 Alcance del Proyecto

ContentFlow Pro es una aplicación web moderna con interfaz drag-and-drop que permite a equipos de creación de contenido administrar el ciclo de vida completo de la preproducción de videos. El sistema gestiona el proceso desde la investigación de competidores y creadores similares hasta la entrega de un guion final listo para producción.

Las funciones principales del sistema son:

- Tablero Kanban interactivo con columnas personalizables por estado del contenido
- Sistema de roles y permisos con tres niveles de acceso (Administrador, Usuario, Espectador)
- Autenticación y base de datos mediante Supabase
- Integración con agentes de Inteligencia Artificial desarrollados con Google Antigravity
- Interfaz responsive y moderna

### 1.3 Definiciones, Acrónimos y Abreviaturas

| Término / Acrónimo | Definición |
|---|---|
| **SRS** | Software Requirements Specification — Documento de Especificación de Requerimientos |
| **Kanban** | Metodología visual de gestión de trabajo mediante columnas y tarjetas |
| **Drag-and-Drop (D&D)** | Técnica de interfaz de usuario que permite arrastrar y soltar elementos |
| **Supabase** | Plataforma de backend de código abierto basada en PostgreSQL con Auth integrado |
| **Google Antigravity** | Plataforma de Google para desarrollo de aplicaciones y agentes de IA |
| **Agente IA** | Entidad autónoma de inteligencia artificial con capacidad de interacción en el sistema |
| **Tarjeta / Card** | Unidad mínima de trabajo que representa una pieza de contenido en el tablero |
| **Columna** | Categoría del estado dentro del flujo de trabajo del tablero Kanban |
| **Sprint** | Periodo de trabajo definido para la planificación de tareas |
| **RBAC** | Role-Based Access Control — Control de Acceso Basado en Roles |
| **RLS** | Row Level Security — Seguridad a Nivel de Fila en Supabase/PostgreSQL |
| **API** | Application Programming Interface — Interfaz de Programación de Aplicaciones |
| **UI/UX** | User Interface / User Experience — Interfaz y Experiencia de Usuario |

### 1.4 Referencias

- Documentación oficial de Supabase: https://supabase.com/docs
- Documentación de Google Antigravity (plataforma de desarrollo y agentes de IA)
- Especificación W3C Web Content Accessibility Guidelines (WCAG) 2.1
- ISO/IEC 25010 — Modelo de calidad de software

### 1.5 Visión General del Documento

El presente documento está organizado en las siguientes secciones:

1. **Introducción:** contexto, alcance y glosario
2. **Descripción General:** perspectiva del producto, características de usuarios y restricciones
3. **Requerimientos Funcionales:** especificación detallada de cada módulo del sistema
4. **Requerimientos No Funcionales:** rendimiento, seguridad, usabilidad y escalabilidad
5. **Arquitectura del Sistema:** modelo de datos, componentes y flujos de integración
6. **Flujo de Trabajo del Contenido:** columnas Kanban y ciclo de vida de las piezas
7. **Casos de Uso:** escenarios de interacción con el sistema
8. **Restricciones y Supuestos**

---

## 2. Descripción General del Sistema

### 2.1 Perspectiva del Producto

ContentFlow Pro opera como una aplicación web standalone desarrollada sobre Google Antigravity, con Supabase como capa de datos y autenticación. No depende de sistemas heredados externos; sin embargo, está diseñada para integrarse con agentes de inteligencia artificial que operen como usuarios colaboradores dentro del tablero.

El sistema se posiciona como una solución especializada para equipos de creación de contenido en video, cubriendo la brecha entre herramientas genéricas de gestión de proyectos (Trello, Asana, Notion) y las necesidades específicas del proceso de preproducción audiovisual.

### 2.2 Funciones Principales del Producto

- Gestión visual de contenido mediante tablero Kanban con drag-and-drop
- Columnas configurables que representan etapas del flujo de preproducción
- Sistema de tarjetas con metadatos enriquecidos para cada pieza de contenido
- Control de acceso basado en roles (Administrador, Usuario, Espectador)
- Asignación y seguimiento de tareas entre colaboradores
- Etiquetado y notificación de usuarios dentro de tarjetas
- Subida, gestión y descarga de archivos adjuntos
- Integración con agentes de IA como usuarios funcionales del sistema
- Panel de administración con gestión de usuarios y base de datos
- Interfaz responsive adaptada a dispositivos de escritorio y móviles

### 2.3 Clases y Características de Usuarios

| Rol | Perfil | Capacidades clave | Restricciones |
|---|---|---|---|
| **Administrador** | Gestor del sistema. Puede ser humano o IA con privilegios máximos. | Gestión total del tablero, usuarios, roles, columnas, base de datos y flujo de trabajo. Asignación de tareas. | Ninguna dentro del sistema. |
| **Usuario / Colaborador** | Miembro del equipo de contenido o agente de IA colaborador. | Ver y responder tareas asignadas, etiquetar usuarios, mover tarjetas entre columnas permitidas, subir archivos. | No puede gestionar usuarios, roles ni configurar el tablero. |
| **Espectador** | Stakeholder, cliente o auditor que requiere visibilidad del proceso. | Iniciar sesión, visualizar el tablero y el movimiento de tarjetas, descargar archivos compartidos. | No puede crear, editar, mover ni eliminar ningún elemento del tablero. |
| **Agente IA** | Bot autónomo basado en Google Antigravity con cuenta de usuario. | Mismos permisos que el rol de usuario asignado por el administrador. Opera mediante API. | Limitado al rol que le asigne el administrador. |

### 2.4 Entorno Operativo

- **Plataforma de desarrollo y hosting:** Google Antigravity
- **Base de datos y autenticación:** Supabase (PostgreSQL + Supabase Auth)
- **Navegadores compatibles:** Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
- **Dispositivos:** escritorio (1280px+), tablet (768px–1279px), móvil (320px–767px)
- **Conexión mínima recomendada:** 5 Mbps para carga fluida de archivos

### 2.5 Restricciones de Diseño e Implementación

- Todo el almacenamiento de datos debe residir en Supabase; no se permiten bases de datos externas adicionales.
- La autenticación de usuarios debe realizarse exclusivamente a través de Supabase Auth.
- Los agentes de IA deben operar con las mismas credenciales y restricciones de rol que los usuarios humanos.
- La interfaz debe cumplir con estándares WCAG 2.1 nivel AA de accesibilidad.
- El frontend debe construirse como aplicación web progresiva (PWA) compatible con Google Antigravity.

---

## 3. Requerimientos Funcionales

### 3.1 Módulo de Autenticación y Gestión de Sesiones

#### 3.1.1 Inicio de Sesión

| ID | Descripción del Requerimiento |
|---|---|
| RF-001 | El sistema debe permitir el inicio de sesión mediante correo electrónico y contraseña a través de Supabase Auth. |
| RF-002 | El sistema debe soportar inicio de sesión mediante proveedores OAuth (Google) gestionados por Supabase Auth. |
| RF-003 | El sistema debe validar el rol y los permisos del usuario al iniciar sesión y cargar la interfaz correspondiente a su nivel de acceso. |
| RF-004 | Los agentes de IA deben autenticarse mediante tokens de servicio (API keys) emitidos por Supabase Auth, con rol preconfigurado. |
| RF-005 | El sistema debe gestionar sesiones con tokens JWT, con expiración configurable y renovación automática. |
| RF-006 | El sistema debe ofrecer cierre de sesión explícito que invalide el token activo. |
| RF-007 | El sistema debe redirigir automáticamente a usuarios no autenticados a la pantalla de inicio de sesión. |

### 3.2 Módulo de Gestión de Usuarios y Roles (Administrador)

| ID | Descripción del Requerimiento |
|---|---|
| RF-008 | El administrador debe poder crear, editar y eliminar cuentas de usuario desde un panel de administración. |
| RF-009 | El administrador debe poder asignar y reasignar roles (Administrador, Usuario, Espectador) a cualquier cuenta. |
| RF-010 | El administrador debe poder crear cuentas para agentes de IA y asignarles el rol de Usuario o Administrador. |
| RF-011 | El sistema debe mostrar un listado de todos los usuarios registrados con su rol, estado (activo/inactivo) y última sesión. |
| RF-012 | El administrador debe poder suspender o reactivar cuentas sin eliminarlas. |
| RF-013 | El administrador debe tener acceso a una vista de la base de datos con capacidad de consulta y exportación de registros. |
| RF-014 | Todas las acciones administrativas sobre usuarios deben registrarse en un log de auditoría. |

### 3.3 Módulo del Tablero Kanban

#### 3.3.1 Columnas del Tablero

| ID | Descripción del Requerimiento |
|---|---|
| RF-015 | El sistema debe mostrar un tablero con columnas horizontales que representen los estados del flujo de preproducción. |
| RF-016 | El administrador debe poder crear, renombrar, reordenar y eliminar columnas del tablero. |
| RF-017 | Cada columna debe mostrar el número de tarjetas que contiene en su encabezado. |
| RF-018 | El sistema debe incluir columnas predeterminadas configurables que reflejen el flujo de preproducción (ver Sección 6). |
| RF-019 | Las columnas deben permitir configuración de límite WIP (Work In Progress) por el administrador. |

#### 3.3.2 Tarjetas de Contenido

| ID | Descripción del Requerimiento |
|---|---|
| RF-020 | El administrador y los usuarios deben poder crear nuevas tarjetas en cualquier columna del tablero. |
| RF-021 | Cada tarjeta debe contener: título, descripción, fecha de creación, fecha límite, responsable(s) asignado(s), etiquetas, prioridad y estado. |
| RF-022 | Los usuarios con rol de Usuario o Administrador deben poder mover tarjetas entre columnas mediante drag-and-drop. |
| RF-023 | Los usuarios deben poder mover una tarjeta a la columna de otro colaborador como mecanismo de remisión de tareas. |
| RF-024 | Cada tarjeta debe contar con una sección de comentarios y registro de actividad con marca de tiempo y autoría. |
| RF-025 | El sistema debe permitir adjuntar archivos a cada tarjeta (ver sección 3.5). |
| RF-026 | El sistema debe permitir etiquetar a usuarios dentro de los comentarios de una tarjeta mediante la sintaxis `@usuario`. |
| RF-027 | Al etiquetar a un usuario, el sistema debe generar una notificación visible dentro de la aplicación para el usuario etiquetado. |
| RF-028 | Las tarjetas deben mostrar un indicador visual de prioridad (Alta, Media, Baja, Urgente). |
| RF-029 | El administrador debe poder archivar o eliminar tarjetas; los usuarios solo pueden archivarlas si tienen el permiso asignado. |

### 3.4 Módulo de Asignación de Tareas

| ID | Descripción del Requerimiento |
|---|---|
| RF-030 | El administrador debe poder asignar una o más tarjetas a colaboradores específicos desde el panel de administración o directamente en la tarjeta. |
| RF-031 | Los usuarios deben poder ver en su vista personalizada únicamente las tarjetas que les han sido asignadas, además del tablero general. |
| RF-032 | El sistema debe permitir asignar múltiples colaboradores (incluyendo agentes de IA) a una misma tarjeta. |
| RF-033 | Al asignar una tarjeta a un usuario, el sistema debe generar una notificación de asignación al destinatario. |
| RF-034 | El sistema debe permitir reasignar tarjetas y registrar el historial de asignaciones en el log de actividad de la tarjeta. |

### 3.5 Módulo de Gestión de Archivos

| ID | Descripción del Requerimiento |
|---|---|
| RF-035 | Los usuarios con rol de Usuario o Administrador deben poder subir archivos adjuntos a tarjetas (documentos, imágenes, videos, guiones, referencias). |
| RF-036 | El sistema debe almacenar los archivos en Supabase Storage. |
| RF-037 | Todos los usuarios (incluidos Espectadores) deben poder visualizar y descargar los archivos adjuntos a tarjetas. |
| RF-038 | El sistema debe mostrar el nombre, tipo, tamaño y fecha de subida de cada archivo adjunto. |
| RF-039 | El sistema debe soportar los formatos: PDF, DOCX, TXT, JPG, PNG, MP4, MOV, GIF, ZIP. |
| RF-040 | El tamaño máximo por archivo será de 100 MB; el administrador podrá configurar este límite. |
| RF-041 | Los archivos eliminados por el administrador deben ser removidos del almacenamiento de Supabase. |

### 3.6 Módulo de Notificaciones

| ID | Descripción del Requerimiento |
|---|---|
| RF-042 | El sistema debe implementar notificaciones en tiempo real mediante Supabase Realtime. |
| RF-043 | Los usuarios deben recibir notificaciones por: asignación de tarjeta, mención (`@usuario`), comentario en tarjeta asignada y movimiento de tarjeta propia. |
| RF-044 | El sistema debe mostrar un contador de notificaciones no leídas en la barra de navegación. |
| RF-045 | Los usuarios deben poder marcar notificaciones como leídas individualmente o todas a la vez. |
| RF-046 | El sistema debe registrar un historial de notificaciones consultable por el usuario. |

### 3.7 Módulo de Integración con Agentes de IA

| ID | Descripción del Requerimiento |
|---|---|
| RF-047 | El sistema debe proporcionar una API REST y/o WebSocket para que los agentes de IA desarrollados en Google Antigravity interactúen con el tablero. |
| RF-048 | Los agentes de IA deben poder autenticarse con tokens de servicio de Supabase Auth. |
| RF-049 | Los agentes de IA deben operar con los mismos permisos RBAC que el rol de usuario que les haya sido asignado. |
| RF-050 | Los agentes de IA deben poder crear tarjetas, agregar comentarios, adjuntar archivos y mover tarjetas dentro de los límites de su rol. |
| RF-051 | Las acciones de los agentes de IA deben identificarse visualmente en el tablero con un indicador de "IA" junto al avatar/nombre del agente. |
| RF-052 | El sistema debe registrar todas las acciones de los agentes en el log de auditoría. |

### 3.8 Módulo de Búsqueda y Filtros

| ID | Descripción del Requerimiento |
|---|---|
| RF-053 | El sistema debe ofrecer una barra de búsqueda global que filtre tarjetas por título, descripción o etiqueta. |
| RF-054 | El sistema debe permitir filtrar tarjetas por: responsable asignado, prioridad, etiqueta, columna y rango de fechas. |
| RF-055 | Los resultados de búsqueda y filtros deben actualizarse en tiempo real conforme el usuario escribe o selecciona opciones. |
| RF-056 | El sistema debe permitir guardar filtros frecuentes como vistas personalizadas. |

---

## 4. Requerimientos No Funcionales

### 4.1 Rendimiento

| ID | Atributo | Especificación |
|---|---|---|
| RNF-001 | Tiempo de carga inicial | La aplicación debe cargar completamente en menos de 3 segundos en una conexión de 10 Mbps. |
| RNF-002 | Respuesta drag-and-drop | El movimiento de tarjetas debe reflejarse en la UI en menos de 200 ms. |
| RNF-003 | Actualización en tiempo real | Los cambios de otros usuarios deben aparecer en pantalla en menos de 1 segundo mediante Supabase Realtime. |
| RNF-004 | Usuarios concurrentes | El sistema debe soportar al menos 100 usuarios concurrentes sin degradación del rendimiento. |
| RNF-005 | Capacidad de base de datos | La arquitectura debe escalar hasta 1 millón de registros de tarjetas sin impacto en el rendimiento de las consultas. |

### 4.2 Seguridad

| ID | Atributo | Especificación |
|---|---|---|
| RNF-006 | Autenticación | Toda autenticación debe realizarse mediante Supabase Auth con tokens JWT firmados. |
| RNF-007 | Autorización a nivel de datos | Supabase Row Level Security (RLS) debe aplicarse en todas las tablas para garantizar que cada usuario acceda únicamente a los datos permitidos por su rol. |
| RNF-008 | Cifrado en tránsito | Todas las comunicaciones entre cliente y servidor deben realizarse mediante HTTPS/TLS 1.3. |
| RNF-009 | Cifrado en reposo | Los archivos en Supabase Storage deben almacenarse cifrados. |
| RNF-010 | Protección contra ataques | El sistema debe implementar protección contra XSS, CSRF, SQL Injection e inyección de prompts en campos de texto libre. |
| RNF-011 | Auditoría | El sistema debe mantener un log inmutable de todas las acciones críticas (creación, edición, eliminación, acceso a datos). |

### 4.3 Usabilidad y Accesibilidad

| ID | Atributo | Especificación |
|---|---|---|
| RNF-012 | Diseño responsive | La interfaz debe adaptarse correctamente a viewports desde 320px hasta 2560px de ancho. |
| RNF-013 | Accesibilidad | El sistema debe cumplir con WCAG 2.1 nivel AA: contraste de color, navegación por teclado, atributos ARIA y textos alternativos. |
| RNF-014 | Curva de aprendizaje | Un usuario nuevo debe poder realizar las tareas básicas (crear tarjeta, moverla, comentar) en menos de 5 minutos sin documentación. |
| RNF-015 | Internacionalización | La interfaz debe soportar al menos español e inglés con posibilidad de expansión a otros idiomas. |
| RNF-016 | Feedback visual | Todas las acciones deben proporcionar retroalimentación visual inmediata (loaders, toasts, estados de error). |

### 4.4 Mantenibilidad y Escalabilidad

| ID | Atributo | Especificación |
|---|---|---|
| RNF-017 | Cobertura de pruebas | El código debe mantener una cobertura mínima de pruebas unitarias del 80%. |
| RNF-018 | Modularidad | La arquitectura frontend debe seguir principios de componentes reutilizables para facilitar el mantenimiento. |
| RNF-019 | Migraciones de base de datos | Todos los cambios de esquema deben gestionarse mediante migraciones versionadas de Supabase. |
| RNF-020 | Disponibilidad | El sistema debe garantizar una disponibilidad del 99.5% mensual. |

---

## 5. Arquitectura del Sistema

### 5.1 Vista General de Componentes

El sistema se estructura en tres capas principales:

- **Capa de Presentación (Frontend):** Aplicación web de página única (SPA) desarrollada con el stack de Google Antigravity. Implementa el tablero Kanban, los módulos de UI y la lógica de interacción del usuario.
- **Capa de Lógica de Negocio / API:** Funciones serverless y Edge Functions de Supabase que gestionan reglas de negocio complejas, validaciones y comunicación con agentes de IA externos.
- **Capa de Datos (Backend):** Supabase proporciona la base de datos PostgreSQL, el sistema de autenticación (Supabase Auth), el almacenamiento de archivos (Supabase Storage) y la capa de tiempo real (Supabase Realtime).

### 5.2 Modelo de Datos — Tablas Principales

| Tabla | Campos Clave | Descripción |
|---|---|---|
| `users` | id, email, full_name, role, avatar_url, is_ai_agent, is_active, created_at | Extiende `auth.users` de Supabase con metadatos de perfil y rol. |
| `boards` | id, name, owner_id, created_at, settings_json | Tablero principal. Un tablero por organización en v1.0. |
| `columns` | id, board_id, name, position, wip_limit, color, created_at | Columnas del tablero Kanban con orden y límite WIP. |
| `cards` | id, column_id, title, description, priority, due_date, created_by, created_at, archived | Tarjeta de contenido con todos sus metadatos. |
| `card_assignees` | card_id, user_id, assigned_at, assigned_by | Relación N:M entre tarjetas y usuarios asignados. |
| `card_labels` | id, card_id, label_id | Etiquetas aplicadas a cada tarjeta. |
| `labels` | id, board_id, name, color | Catálogo de etiquetas disponibles en el tablero. |
| `comments` | id, card_id, user_id, content, created_at, updated_at | Comentarios en tarjetas con soporte de menciones. |
| `attachments` | id, card_id, uploaded_by, file_name, file_size, mime_type, storage_path, created_at | Metadatos de archivos adjuntos almacenados en Supabase Storage. |
| `notifications` | id, user_id, type, payload_json, is_read, created_at | Notificaciones en tiempo real para cada usuario. |
| `activity_log` | id, card_id, user_id, action_type, old_value, new_value, created_at | Historial inmutable de todas las acciones sobre tarjetas. |
| `audit_log` | id, actor_id, action, resource_type, resource_id, metadata_json, created_at | Log de auditoría del sistema para el administrador. |

### 5.3 Seguridad a Nivel de Datos — Políticas RLS

Supabase Row Level Security se implementará con las siguientes políticas base:

- **`users`:** Los usuarios solo pueden leer su propio perfil y los perfiles básicos de compañeros; solo el administrador puede modificar roles.
- **`cards`:** Los Espectadores solo tienen acceso `SELECT`; los Usuarios pueden `INSERT`/`UPDATE` en tarjetas de su tablero asignado; solo el administrador puede `DELETE`.
- **`attachments`:** Todos los usuarios autenticados pueden `SELECT`; los archivos se sirven con URLs prefirmadas de Supabase Storage.
- **`audit_log`:** Solo el rol de Administrador tiene acceso `SELECT`; ningún usuario puede `INSERT`, `UPDATE` ni `DELETE` directamente.

### 5.4 Flujo de Integración con Agentes de IA

1. El administrador crea una cuenta de agente con el flag `is_ai_agent = true` y le asigna un rol.
2. Supabase Auth emite un token de servicio para el agente, restringido mediante RLS al rol asignado.
3. El agente de Google Antigravity realiza llamadas a la API de Supabase (REST o Realtime) usando dicho token.
4. Todas las acciones del agente quedan registradas en el `activity_log` y el `audit_log` con el identificador del agente.
5. La UI del tablero identifica visualmente las acciones del agente con un badge distintivo.

---

## 6. Flujo de Trabajo del Contenido — Columnas Kanban

Las siguientes columnas representan el flujo de preproducción estándar. El administrador puede personalizarlas, reordenarlas o agregar nuevas etapas según las necesidades del equipo.

| # | Nombre de Columna | Descripción / Criterio de Entrada y Salida | Responsable Típico |
|---|---|---|---|
| 1 | **Ideas / Backlog** | Banco de ideas de contenido identificadas. **Entrada:** cualquier idea válida. **Salida:** idea aprobada para investigación. | Administrador / Usuario |
| 2 | **Investigación de Competidores** | Recolección de datos sobre creadores similares, tendencias y brechas de contenido. **Entrada:** idea aprobada. **Salida:** informe de investigación adjunto. | Usuario / Agente IA |
| 3 | **Análisis de Audiencia** | Definición del perfil de audiencia objetivo y ángulo de valor diferencial del video. **Entrada:** informe de investigación. **Salida:** brief de audiencia. | Usuario / Administrador |
| 4 | **Definición del Concepto** | Aprobación del ángulo narrativo, título tentativo y estructura general del video. **Entrada:** brief de audiencia. **Salida:** concepto aprobado. | Administrador |
| 5 | **Estructura / Outline** | Desarrollo del esquema de secciones, puntos clave y llamadas a la acción. **Entrada:** concepto aprobado. **Salida:** outline estructurado. | Usuario / Agente IA |
| 6 | **Borrador de Guion** | Redacción del primer borrador completo del guion narrativo. **Entrada:** outline aprobado. **Salida:** borrador v1 adjunto. | Usuario / Agente IA |
| 7 | **Revisión Editorial** | Revisión de coherencia, estilo, ritmo y precisión de la información. **Entrada:** borrador v1. **Salida:** comentarios editoriales y v2. | Administrador / Usuario Senior |
| 8 | **Correcciones** | Implementación de los cambios editoriales indicados. **Entrada:** comentarios de revisión. **Salida:** borrador revisado. | Usuario / Agente IA |
| 9 | **Aprobación Final** | Validación del guion por el responsable editorial. **Entrada:** borrador revisado. **Salida:** guion aprobado para producción. | Administrador |
| 10 | **Listo para Producción** | Guion finalizado, empaquetado con todos los assets de referencia y listo para el equipo de producción. | Administrador |

---

## 7. Casos de Uso Principales

### CU-01: Inicio de Sesión con Rol Específico

| Campo | Detalle |
|---|---|
| **Actor** | Cualquier usuario registrado (humano o agente IA) |
| **Precondición** | El usuario posee credenciales válidas asignadas por el administrador |
| **Flujo Principal** | 1. Usuario ingresa credenciales en la pantalla de inicio de sesión. 2. Supabase Auth valida las credenciales y emite token JWT. 3. El sistema consulta el rol del usuario en la tabla `users`. 4. La UI carga la vista correspondiente al rol (tablero completo para Administrador y Usuario; vista de solo lectura para Espectador). |
| **Flujo Alternativo** | Si las credenciales son incorrectas, el sistema muestra mensaje de error. Después de 5 intentos fallidos, la cuenta se bloquea temporalmente por 15 minutos. |
| **Postcondición** | El usuario accede al tablero con las capacidades correspondientes a su rol. |

### CU-02: Crear y Asignar Tarjeta de Contenido

| Campo | Detalle |
|---|---|
| **Actor** | Administrador o Usuario con permiso de creación |
| **Precondición** | El actor ha iniciado sesión y el tablero está disponible |
| **Flujo Principal** | 1. Actor hace clic en el botón '+' de una columna. 2. Se abre el modal de creación de tarjeta. 3. Actor completa título, descripción, prioridad, fecha límite y etiquetas. 4. Actor selecciona uno o más colaboradores para asignar la tarjeta. 5. El sistema crea el registro en `cards` y en `card_assignees`. 6. El sistema envía notificación de asignación a los colaboradores. 7. La tarjeta aparece en la columna seleccionada en tiempo real para todos los usuarios. |
| **Flujo Alternativo** | Si el límite WIP de la columna está alcanzado, el sistema muestra una advertencia. El administrador puede ignorarla; el usuario regular no puede agregar la tarjeta. |
| **Postcondición** | Tarjeta creada y visible en el tablero; colaboradores notificados. |

### CU-03: Mover Tarjeta entre Columnas (Drag-and-Drop)

| Campo | Detalle |
|---|---|
| **Actor** | Usuario o Administrador |
| **Precondición** | El actor ha iniciado sesión con rol de Usuario o Administrador |
| **Flujo Principal** | 1. El actor arrastra una tarjeta desde su columna actual. 2. El sistema resalta visualmente las columnas de destino válidas. 3. El actor suelta la tarjeta en la columna destino. 4. El sistema actualiza el `column_id` de la tarjeta en la base de datos. 5. El movimiento se registra en el `activity_log` con actor, origen y destino. 6. Todos los usuarios con el tablero abierto ven el movimiento en tiempo real. |
| **Flujo Alternativo** | Si el usuario intenta mover una tarjeta no asignada a él, el sistema puede permitirlo (configuración del administrador) o mostrar un aviso de confirmación. |
| **Postcondición** | Tarjeta en nueva columna; movimiento registrado y visible en tiempo real. |

### CU-04: Agente IA Genera Borrador de Guion

| Campo | Detalle |
|---|---|
| **Actor** | Agente IA (Google Antigravity) con rol de Usuario |
| **Precondición** | El agente tiene token de autenticación válido y una tarjeta en la columna "Estructura / Outline" le ha sido asignada |
| **Flujo Principal** | 1. El agente recibe el evento de asignación vía Supabase Realtime. 2. El agente recupera los datos de la tarjeta (título, descripción, archivos adjuntos) mediante la API de Supabase. 3. El agente genera el borrador de guion. 4. El agente adjunta el archivo del guion a la tarjeta mediante Supabase Storage. 5. El agente agrega un comentario a la tarjeta indicando la entrega del borrador. 6. El agente mueve la tarjeta a la columna "Borrador de Guion". 7. Todas las acciones quedan registradas en el `activity_log` con el identificador del agente. |
| **Postcondición** | Borrador de guion disponible como adjunto; tarjeta en nueva columna; equipo notificado. |

---

## 8. Restricciones y Supuestos

### 8.1 Restricciones

- La solución debe construirse exclusivamente sobre Google Antigravity como plataforma de hosting y desarrollo frontend.
- Supabase es la única plataforma permitida para base de datos, autenticación y almacenamiento de archivos.
- No se implementarán funcionalidades de videoconferencia integrada en esta versión.
- El sistema no soportará múltiples organizaciones o workspaces en la versión inicial (multi-tenancy fuera de alcance para v1.0).
- Los agentes de IA no tendrán acceso directo al log de auditoría ni a la gestión de usuarios, independientemente de su rol configurado.

### 8.2 Supuestos

- El equipo de desarrollo tiene acceso a un proyecto de Supabase configurado con plan Pro para soportar los límites de almacenamiento y conexiones concurrentes requeridos.
- Los agentes de IA de Google Antigravity pueden comunicarse con la API REST de Supabase sin restricciones de red.
- El administrador inicial del sistema será configurado manualmente en la base de datos durante el proceso de despliegue inicial.
- Los usuarios finales contarán con navegadores modernos actualizados (Chrome, Firefox, Safari, Edge en versiones lanzadas en 2024 o posterior).
- El volumen inicial de uso no excederá los 50 usuarios concurrentes ni las 500 tarjetas activas durante los primeros 6 meses de operación.

### 8.3 Dependencias Externas

| Dependencia | Versión / Plan Requerido | Uso en el Sistema |
|---|---|---|
| **Supabase** | Plan Pro o superior | Base de datos, Auth, Storage, Realtime |
| **Google Antigravity** | Licencia activa | Plataforma de desarrollo y hosting frontend, agentes IA |
| **Supabase Auth** | Integrado en Supabase | Autenticación de usuarios humanos y agentes IA |
| **Supabase Storage** | Integrado en Supabase | Almacenamiento de archivos adjuntos |
| **Supabase Realtime** | Integrado en Supabase | Sincronización en tiempo real del tablero |

---

## Apéndice A: Resumen de Requerimientos por Módulo

| Módulo | RF Funcionales | RNF No Funcionales | Casos de Uso |
|---|---|---|---|
| Autenticación y Sesiones | RF-001 a RF-007 | RNF-006, RNF-007, RNF-008 | CU-01 |
| Gestión de Usuarios y Roles | RF-008 a RF-014 | RNF-007, RNF-011 | — |
| Tablero Kanban (Columnas) | RF-015 a RF-019 | RNF-001, RNF-002, RNF-003 | CU-03 |
| Tablero Kanban (Tarjetas) | RF-020 a RF-029 | RNF-001 a RNF-005 | CU-02, CU-03 |
| Asignación de Tareas | RF-030 a RF-034 | RNF-003, RNF-011 | CU-02 |
| Gestión de Archivos | RF-035 a RF-041 | RNF-009, RNF-010 | CU-04 |
| Notificaciones | RF-042 a RF-046 | RNF-003 | CU-02, CU-04 |
| Integración Agentes IA | RF-047 a RF-052 | RNF-004, RNF-007, RNF-011 | CU-04 |
| Búsqueda y Filtros | RF-053 a RF-056 | RNF-001, RNF-002 | — |

---

*Documento generado en Marzo 2026 — Versión 1.0 — Sujeto a revisión y aprobación del equipo de stakeholders.*
