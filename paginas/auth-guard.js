/*
  auth-guard.js
  -------------
  Pegar estos 4 scripts justo antes de </head> o al inicio de <body>
  en profesores.html, ANTES que el resto del contenido/lógica de esa página:

  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js"></script>
  <script src="firebase-config.js"></script>
  <script src="auth-guard.js"></script>
*/

(function () {
  // Oculta el contenido hasta confirmar que hay sesión (evita el "flash" de contenido protegido)
  document.documentElement.style.visibility = 'hidden';

  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      // No hay sesión válida -> afuera
      window.location.href = 'login.html';
    } else {
      // Sesión válida -> mostrar la página
      document.documentElement.style.visibility = 'visible';
    }
  });
})();

// Función de logout — enganchala a un botón así:
// <button onclick="cerrarSesion()">Cerrar sesión</button>
function cerrarSesion() {
  firebase.auth().signOut().then(function () {
    window.location.href = 'login.html';
  });
}