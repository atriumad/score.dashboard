# Score: formulario de eventos + dashboards (solución temporal)

Fecha: 2026-11-19 · Estado: pendiente de aprobación

## Intención

Score necesita recibir y dar seguimiento a solicitudes de eventos, y ordenar a sus candidatos por etapa, desde ya. Todo esto vivirá en la nueva plataforma; lo que se construye aquí es temporal y debe costar poco de hacer y poco de tirar.

## Metas

1. Formulario de solicitud de eventos en scoreusa.com.
2. Dashboard sencillo donde llegan esas solicitudes y se les da seguimiento.
3. Overview de paquetes de eventos en la página de Score.
4. Dashboard de hiring con candidatos clasificados por etapas.

## Fuera de alcance

- Notas internas, asignación a responsables, historial de cambios.
- Envío de correos desde el dashboard.
- Usuarios múltiples o roles (sigue el login único actual).
- Calendario, disponibilidad, cotizaciones o pagos.
- Editar o borrar entradas desde el dashboard.

## Anti-metas

- Infraestructura nueva (bases de datos, servicios) para algo temporal.
- Romper el dashboard de hiring o perder los estatus ya guardados.
- Publicar paquetes o precios inventados: el contenido lo entrega Litzabel.

## Estado actual

- `scre.atrium`: app Next 16 (`job-dashboard`, enlazada a Vercel) con login único. Lee el Career Form (Gravity Forms, form 3, `/careers/`) por la API REST de GF y guarda el estatus de cada candidato en Redis (Upstash), hash `job_statuses`.
- Estatus actuales: `received`, `reviewing`, `approved`, `rejected`, más `new` automático durante las primeras 24 h.
- scoreusa.com no tiene formulario de eventos. Las páginas `/parties-events/`, `/group-parties/` y `/corporate-events/` solo tienen el form de newsletter y una sección "Pricing" sin precios.
- El repo tiene un solo commit; el trabajo real está sin commitear. Dependencias sin instalar.

## Enfoques considerados

| | A. Gravity Forms en WordPress | B. Formulario propio en la app |
|---|---|---|
| Datos | En WP; el dashboard los lee como hiring | Redis; hay que construir el guardado |
| Aviso por correo | Notificaciones de GF | Hay que construirlo |
| Anti-spam | Incluido en GF | Hay que construirlo |
| Dependencia | Acceso admin a WP | Ninguna, pero el form queda fuera del sitio |

**Elegido: A** (decisión de Ventura). Repite el patrón ya probado con hiring y deja menos código que tirar.

## Diseño

### 1. Hiring: etapas

- Pipeline: `New → Reviewing → Interview → Offer → Hired`, más `Rejected`. *(Propuesta mía; nadie definió las etapas.)*
- `New` deja de ser automático por 24 h: es la etapa de todo candidato sin etapa asignada. Desaparece `received`.
- Estatus ya guardados se traducen al leer, sin tocar Redis: `received → New`, `reviewing → Reviewing`, `approved → Hired`, `rejected → Rejected`.
- Sobre la tabla: una fila de etapas con su conteo. Clic en una etapa filtra la tabla. El conteo se actualiza al cambiar la etapa de un candidato.
- El selector de etapa por candidato se mantiene en tabla y en detalle.

```
[ New 12 ] [ Reviewing 5 ] [ Interview 3 ] [ Offer 1 ] [ Hired 4 ] [ Rejected 9 ]
 Buscar…                                   [ Todas las áreas ▾ ]
 Nombre      Áreas            Recibido     Etapa
 ─────────────────────────────────────────────────────
 Ana Pérez   Guest Services   Nov 18       ● Interview ▾
```

### 2. Formulario de eventos (WordPress, Gravity Forms)

Campos *(propuesta mía)*:

| Campo | Tipo | Requerido |
|---|---|---|
| Nombre | nombre | sí |
| Email | email | sí |
| Teléfono | teléfono | sí |
| Empresa / organización | texto | no |
| Tipo de evento | lista: Birthday Party, Corporate Event, Group Party, Other | sí |
| Fecha deseada | fecha | sí |
| Hora de inicio | hora | no |
| Número de invitados | número | sí |
| Paquete de interés | lista (se llena con el contenido de Litzabel; incluye "Not sure yet") | no |
| Detalles | párrafo | no |

- Idioma del formulario: inglés, como el resto del sitio.
- Se coloca en `/parties-events/`, `/group-parties/` y `/corporate-events/`.
- Notificación de GF al equipo de eventos de Score y mensaje de confirmación al visitante.
- El campo "Paquete de interés" se publica solo con "Not sure yet" hasta tener el contenido.

### 3. Dashboard de eventos (app)

- Navegación en el header: `Hiring | Events`. Hiring se queda en `/`.
- `/events`: tarjetas de resumen (total, nuevas esta semana, eventos en los próximos 30 días), fila de etapas con conteo, búsqueda, filtro por tipo de evento y tabla (nombre, tipo, fecha del evento, invitados, recibido, etapa). Orden por defecto: más recientes primero.
- `/events/[id]`: todos los campos de la solicitud, contacto copiable y selector de etapa.
- Etapas *(propuesta mía)*: `New → Contacted → Quoted → Confirmed → Completed`, más `Lost`.
- Etapas guardadas en Redis en un hash aparte, `event_statuses`.
- Mismo login y misma protección de rutas que hiring.

### 4. Overview de paquetes (WordPress)

- Va en la sección "Pricing" de las páginas de eventos, con un botón por paquete que lleva al formulario.
- **Bloqueado** hasta que Litzabel ponga el contenido en el ticket. Se construye al final.

## Cambios técnicos en la app

- `lib/gravity-forms.ts`: `getEntries(formId)` recibe el form; nueva variable `GF_EVENTS_FORM_ID`.
- `lib/status.ts` y `/api/status`: aceptan un tipo (`hiring` | `events`) que decide el hash y las etapas válidas.
- `lib/extract.ts`: extractor nuevo para solicitudes de evento; los IDs de campo se fijan tras crear el form.
- Detalle (`/applications/[id]`, `/events/[id]`): verificar que la entrada pertenece al form correcto antes de mostrarla.
- `proxy.ts`: proteger `/events` y `/api/events`.
- Límite conocido: se lee una sola página de 200 entradas por form. Aceptable para algo temporal; se anota, no se resuelve.

## Orden de trabajo

1. Commit del estado actual como línea base (requiere visto bueno).
2. Hiring: etapas. No depende de nada.
3. WordPress: crear el form de eventos y colocarlo en las páginas.
4. App: dashboard de eventos.
5. Deploy a Vercel con la variable nueva (requiere visto bueno).
6. WordPress: overview de paquetes, cuando llegue el contenido.

## Verificación

- Estatus viejos de hiring aparecen en la etapa traducida correcta.
- Una solicitud de prueba enviada desde scoreusa.com aparece en `/events` y dispara la notificación; se borra después.
- Cambiar etapa persiste tras recargar, en hiring y en eventos.
- Rutas nuevas redirigen a login sin sesión.

## Pendiente de terceros

- Acceso admin a WordPress (Ventura).
- Correo que recibe las notificaciones de eventos (Score).
- Contenido de paquetes (Litzabel).

## A criterio de quien construye

- Componentes compartidos entre hiring y eventos vs. duplicados.
- Colores de cada etapa.
- Cómo insertar el form y los paquetes según el constructor de páginas que use el sitio.
