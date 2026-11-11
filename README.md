# SIE — CEDM Santa Teresa de Ávila

Sitio web escolar y panel docente del Centro Educativo Departamental Municipal Santa Teresa de Ávila.

- **Sitio:** https://cedm-santa-teresa-avila.github.io/SIE/
- **Repositorio:** https://github.com/cedm-santa-teresa-avila/SIE
- **Organización de GitHub:** https://github.com/cedm-santa-teresa-avila

## Empezar a trabajar

El proyecto es un sitio estático de HTML, CSS y JavaScript; no requiere instalar paquetes ni compilarlo.

```bash
git clone https://github.com/cedm-santa-teresa-avila/SIE.git
cd SIE
git switch -c feat/descripcion-del-cambio
```

Para previsualizarlo, abrí la carpeta en VS Code y usá una extensión de servidor local como **Live Server**. Abrí la URL en `localhost`; evitá abrir los archivos directamente con `file://`, porque varias funciones necesitan ejecutarse desde un servidor web.

Antes de guardar un cambio:

```bash
git diff --check
git status --short
```

Después, guardalo en una rama y publicala:

```bash
git add archivo-modificado
git commit -m "Describe el cambio"
git push -u origin feat/descripcion-del-cambio
```

Abrí un pull request hacia `main` para revisar el cambio. Al integrarlo, GitHub Actions publica el sitio. Confirmá que **pages build and deployment** termine con resultado `success` en la pestaña **Actions**.

## Estructura del proyecto

| Archivo o carpeta | Contenido |
| --- | --- |
| `index.html` | Portada, cursos y avisos generales |
| `paginas/primero.html` | Tareas, horario y avisos de Primero |
| `paginas/segundo.html` | Tareas, horario y avisos de Segundo |
| `paginas/tercero.html` | Tareas, horario y avisos de Tercero |
| `login.html` | Acceso y recuperación de contraseña para docentes |
| `profesores.html` | Panel de publicación y administración docente |
| `config.js` | Hojas de cálculo, lectura CSV y avisos por curso |
| `horarios.js` | Preparación y presentación de horarios |
| `roles.js`, `tareas-activas.js`, `docente-nav.js` | Roles, retiro de tareas y navegación del panel |
| `firebase-config.js` | Configuración pública del cliente Firebase |
| `*.css` | Estilos generales, cursos, horarios, roles e información |
| `imagenes/` | Insignias e imágenes del sitio |

## Cómo funciona el sitio

- **Inicio y cursos:** leen avisos y tareas desde Google Sheets. Las páginas de curso permiten filtrar tareas por fecha y materia, alternar entre tareas, horario y avisos, y ver adjuntos cuando existen.
- **Avisos:** la hoja `avisos` alimenta la portada y las páginas de curso. Se muestran avisos activos, generales o del curso seleccionado, dentro de su vigencia.
- **Horarios:** la hoja `horarios` define día, hora de inicio y fin, materia, profesor y tipo de bloque (`clase` o `recreo`). Las horas usan formato de 24 horas y los bloques de un mismo día no deben superponerse.
- **Panel docente:** Firebase Authentication verifica la sesión y el correo. El panel envía solicitudes autenticadas a Apps Script para publicar o retirar contenido.
- **Permisos:** el panel consulta a Apps Script quién inició sesión y qué acciones puede hacer. La interfaz no concede permisos por sí sola; la decisión debe mantenerse en el backend.
- **Recuperación de acceso:** el formulario de `login.html` usa Firebase para enviar el correo de recuperación.

## Hojas de datos

Los nombres de las pestañas y sus archivos se configuran en `config.js`. Mantené los encabezados requeridos y actualizá el código si cambia el esquema.

- **`avisos`:** `id`, `publicado_en`, `titulo`, `descripcion`, `curso`, `tipo`, `fecha_evento`, `vigente_hasta`, `estado`.
- **`tareas`:** `Curso`, `Materia(Primero)`, `Materia(Segundo)`, `Materia(Tercero)`, `Titulo`, `Descripcion`, `Entrega` y `Archivo`.
- **`horarios`:** `curso`, `dia`, `inicio`, `fin`, `materia`, `profesor`, `tipo`.

Los encabezados de avisos y horarios distinguen mayúsculas y minúsculas según el código. Para los horarios, usá los días de la semana en español y los nombres de curso `primero`, `segundo` o `tercero`.

**Datos pendientes:** actualmente la hoja de horarios tiene registros para Tercero, pero no para Primero ni Segundo. Esas páginas muestran “Horario pendiente de carga” hasta que el colegio agregue sus horarios reales.

## Acceso y seguridad

- Las cuentas docentes deben existir en Firebase y tener el correo verificado. El formulario del sitio no crea cuentas.
- Los permisos del panel SIE y el rol Admin de GitHub son distintos. Ser Admin en GitHub no asigna automáticamente permisos docentes, y viceversa.
- `firebase-config.js` contiene configuración del cliente web, no contraseñas. No subas contraseñas, claves privadas, credenciales de servicio ni tokens al repositorio.
- La publicación usa Apps Script; probá cambios de escritura solo con autorización y datos de prueba.
- La administración de usuarios requiere el rol correspondiente asignado por el proceso institucional del backend.

## Ayuda para usuarios

La guía dentro del sitio está en [Guía de uso](guia-de-uso.html). La información de privacidad está en [Privacidad](privacidad.html).
