# Nota técnica de integración y publicación

Este documento describe la integración que está activa en el repositorio `cedm-santa-teresa-avila/SIE`. La guía de desarrollo y uso está en [README.md](README.md).

## Componentes integrados

- `index.html`: portada, navegación, cursos y avisos generales.
- `paginas/primero.html`, `paginas/segundo.html`, `paginas/tercero.html`: vistas de tareas, horarios y avisos por curso.
- `login.html`: inicio de sesión y recuperación de contraseña mediante Firebase Authentication.
- `profesores.html`: panel docente para publicar tareas y avisos, y revisar publicaciones activas.
- `config.js`: configuración de las hojas, lectura CSV y renderizado seguro de avisos.
- `horarios.js`: validación de los bloques y vistas diaria/semanal del horario.
- `auth-guard.js`, `roles.js`, `tareas-activas.js`, `docente-nav.js`: protección de rutas, consulta de permisos, retiro de tareas y navegación del panel.
- `firebase-config.js`: configuración pública para inicializar el cliente Firebase.

## Flujo de datos y permisos

Las páginas públicas leen las pestañas `avisos`, `tareas` y `horarios` de Google Sheets. El panel docente obtiene un ID token de Firebase y lo envía a la URL de Apps Script definida en `profesores.html`; las funciones de roles y retiro de tareas reutilizan esa URL. El backend debe validar la identidad, el estado y los permisos antes de modificar datos.

La interfaz puede ocultar controles según el resultado de esa consulta, pero esa presentación no reemplaza la autorización del backend. Los cambios de permisos se registran mediante la acción de roles.

## Publicación

El repositorio publica GitHub Pages desde `main` y la raíz del proyecto. Al llegar un cambio a `main`, el flujo **pages build and deployment** genera y despliega el sitio en:

https://cedm-santa-teresa-avila.github.io/SIE/

Se puede comprobar el resultado en la pestaña **Actions** del repositorio. La última publicación verificada durante la actualización de esta nota terminó correctamente.

## Estado y límites conocidos

- La navegación por pestañas de los tres cursos está implementada y fue comprobada en el sitio publicado.
- La hoja de horarios actualmente contiene horarios de Tercero. Primero y Segundo necesitan que el colegio cargue sus horarios para mostrar datos.
- La autenticación real, las escrituras del panel y la administración de roles requieren cuentas y permisos institucionales; no se deben probar enviando cambios a hojas reales sin autorización.
- El límite operativo de adjuntos depende tanto de la validación del cliente como de Apps Script y Drive. Si se cambia, verificar ambos lados antes de comunicar el nuevo límite.

Esta nota reemplaza la descripción histórica que presentaba el sitio como una versión candidata sin publicar.
