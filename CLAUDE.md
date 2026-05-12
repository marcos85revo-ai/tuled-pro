# CLAUDE.md — tuled.pro · Documentación de Trabajo para Claude Code

Este archivo es la memoria permanente del proyecto. Léelo completo al inicio de cada sesión. Todas las decisiones técnicas ya tomadas están aquí. No las cuestiones, respétalas.

## 1. IDENTIDAD DEL PROYECTO

Nombre: tuled.pro
Tipo: Configurador profesional de pantallas LED
Público: Instaladores, integradores AV, compradores corporativos del sector audiovisual
URL producción: https://tuled.pro (Netlify)
Repositorio: https://github.com/marcos85revo-ai/tuled-pro (rama main)

Quién soy yo (el propietario): Soy el dueño del proyecto, no soy técnico. Necesito que me expliques siempre en lenguaje simple qué hace cada cambio y por qué. Implementa los cambios directamente en index.html, no me des código para copiar y pegar. Confirma qué has cambiado al final de cada tarea. Avísame si algo puede romper algo que ya funciona.

## 2. ARQUITECTURA TÉCNICA — NO cambiar sin consultarme

Frontend: HTML + CSS + JS puro. Single file: index.html. Sin frameworks. Sin React. Sin Vue. Todo integrado.
Base de datos: Supabase (PostgreSQL). SDK JS v2 vía CDN jsDelivr.
Hosting: Netlify. Deploy automático desde GitHub rama main.
IA Conclusión: Claude API via Netlify Function /.netlify/functions/claude-proxy
IA Pliegos: Claude API via Netlify Function /.netlify/functions/analizar-pliego
Extracción PDF: PDF.js v3.11 (CDN). Máx. 80 páginas. Carga dinámica.
Extracción DOCX: Mammoth.js v1.6 (CDN). Carga dinámica.

REGLA DE ORO: Todo el código vive en index.html. Las únicas excepciones son las Netlify Functions en /netlify/functions/. No crear archivos JS o CSS separados.

Credenciales Supabase:
URL: https://eelxjvuabbxyjtluwhve.supabase.co
KEY: sb_publishable_r8-y0q8htUrlDu8sUuHl-w_eZVrxM2F

## 3. DESIGN SYSTEM v4.0 — NO modificar

Colores CSS:
--bg: #0D1117
--bg2: #090D12
--surface: #131B27
--surface2: #182030
--surface3: #1D2838
--cyan: #29B6F6
--green: #00E6A8
--orange: #F07840
--red: #FF2D55
--yellow: #F5C542
--white: #F4F7FB
--text: #C8DCF0
--text2: #8AA4BC
--text3: #4E6880

Tipografías: Barlow Condensed (títulos), Barlow (cuerpo), JetBrains Mono (valores técnicos)

## 4. BASE DE DATOS — TABLAS ACTIVAS EN PRODUCCIÓN

catalogo_productos: Catálogo LED. Fuente del configurador.
leads: Usuarios que interactuaron con la plataforma.
lead_acciones: Historial cronológico de acciones por lead.
notificaciones_admin: Notificaciones generadas por acciones de usuarios.
pliegos_analizados: Pliegos de licitación analizados por IA.

Columnas catalogo_productos: id, fabricante, modelo, entorno, tecnologia, led_type, pixel_pitch_mm, panel_ancho_mm, panel_alto_mm, panel_profundidad_mm, panel_pixeles_h, panel_pixeles_v, panel_peso_kg, panel_material, modulo_ancho_mm, modulo_alto_mm, brillo_nits, refresh_hz, grises_bit, contraste, temperatura_color_k, angulo_h, angulo_v, driving_type, voltaje_ac, consumo_max_w_m2, consumo_avg_w_m2, calor_max_btu_h_m2, calor_avg_btu_h_m2, temp_almacenamiento, temp_operacion, humedad_almacenamiento, humedad_operacion, ip_frontal, ip_trasero, mantenimiento_modulo, mantenimiento_psu, tipo_instalacion, rigging_max_qty, certificaciones, ficha_tecnica_url, observaciones, creado_en, actualizado_en, producto_uid, serie_id

Columnas que NO existen en BD (siempre null): serie, gama_color_ntsc, calibracion_fabrica, emc, vida_util_horas, garantia_anos

## 5. LO QUE YA ESTÁ IMPLEMENTADO

Wizard 6 pasos: completamente funcional. No modificar su lógica sin causa justificada.
Algoritmo scoring 7 factores: implementado. Bonus Absen +3 puntos si score mayor o igual a 78. Score máximo 99.
Sistema análisis pliegos: funcional. PDF.js + Mammoth.js + Netlify Function.
Sistema leads y captación: 4 puntos de captación funcionando. Función upsertLead() con upsert por email.
Generación informe HTML: funcional. Descarga directa vía Blob URL.
Admin Panel completo: Dashboard, Catálogo CRUD, Leads, Pliegos, Notificaciones, Ajustes. Todo con datos reales de Supabase.
Autenticación: Supabase Auth real con sesión persistente. No hay credenciales hardcoded.

## 6. TAREAS PENDIENTES

1. Analítica con datos reales: implementar tabla eventos_configurador en Supabase y registrar eventos del cliente.
2. Reporte semanal automático por email.
3. Mejoras UX del formulario de catálogo.

## 7. REGLAS DE TRABAJO

Siempre: leer CLAUDE.md y index.html antes de cualquier cambio. Implementar directamente en el archivo. Respetar Design System v4.0. Explicar en lenguaje simple qué se hizo. Hacer git add, git commit y git push al finalizar cada tarea.

Nunca: crear archivos CSS o JS separados. Usar frameworks externos. Cambiar variables CSS del Design System. Exponer API keys de Anthropic en código cliente. Hacer commits mezclando múltiples features.

Flujo git al terminar cada tarea:
git add index.html
git commit -m "feat: descripción corta"
git push origin main

## BACKLOG — Tareas pendientes

### 🔧 Admin Panel
- HECHO: Al hacer clic en el botón "Admin" del header, el panel admin debe abrirse en una nueva pestaña del navegador, no dentro de la misma página. Cambio mínimo en el botón del header.

### 🌍 Configurador — Multiidioma
- PENDIENTE: Añadir selector de idioma Español / Inglés en el configurador. Si el usuario selecciona inglés, toda la interfaz aparece en inglés: botones, textos del wizard, parámetros técnicos, conclusión IA generada por Claude, etc. Claude Code lo implementa automáticamente.

### 🔐 Acceso Beta — Configurador
- HECHO: Mostrar pantalla de bienvenida "Prueba Beta" al entrar a tuled.pro. El usuario debe introducir login y contraseña para acceder al configurador. Credenciales correctas: usuario "alfaybeta26" / contraseña "testing31@2026". Si las credenciales son correctas, el configurador se desbloquea normalmente. El Admin Panel mantiene su propio sistema de login independiente y no se ve afectado. La pantalla beta debe desaparecer una vez autenticado y no volver a aparecer si el usuario recarga la página (persistir en localStorage).
