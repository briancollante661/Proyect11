# Integración visual SIE — revisión requerida

Origen funcional: `Proyect11-main.zip` facilitado por el usuario.
Origen visual: `SIE - COPIA PREMIUM - copia.zip` facilitado por el usuario.

## Qué se trasladó
- Portada, navbar móvil, animaciones, avisos generales y modal: `index.html`.
- Pantalla de acceso premium y ojo animado: `login.html`.
- Diseño del panel docente en dos columnas y lista de adjuntos: `profesores.html`.
- Cursos, accesos rápidos, paneles y responsive: `paginas/{primero,segundo,tercero}.html`.
- Estilos visuales de cursos: `estilos.css`.

## Qué se conservó del repositorio original
- `config.js` íntegro (nombres de hojas, parser CSV y función de avisos por curso).
- `auth-guard.js` y `firebase-config.js` íntegros.
- `imagenes/` íntegra.
- Reintento/confirmación de publicaciones de tareas (`solicitudId`) del panel docente.
- Función original de envío de correo de recuperación de contraseña en login.
- Avisos filtrados por estado activo, curso general y fecha de vigencia en Inicio; avisos por curso desde helper original.

## Límites importantes
- Se muestra selección de hasta 10 archivos y 5 MB por archivo. **Se conserva además la restricción original de 10 MB en total** en cliente. No se ha verificado que Apps Script admita diez archivos.
- La autenticación, carga de datos y subida real necesitan pruebas manuales en un entorno de servidor válido y con permisos autorizados.
- No se incluyen carpetas temporales o scripts de Taste Skill. No se ha modificado ningún repositorio remoto ni se ha ejecutado git push.
- Revisar el comportamiento del menú, filtros y paneles en pantallas 320, 360, 768 y 1440px antes de publicar.

## Precaución
Este ZIP es una **versión candidata para pruebas**, no una versión validada en producción. Revisar diferencias antes de fusionar con `main`.
