/*
  firebase-config.js
  -------------------
  Configuración pública del proyecto Firebase (CEDM Santa Teresa De Ávila).
  Esto NO es secreto, está pensado para vivir en el frontend.
*/

const firebaseConfig = {
  apiKey: "AIzaSyCG0DpmnSYe-OqIuMpVraVsec2GMSoWhnc",
  authDomain: "cedm-santa-teresa-de-avila.firebaseapp.com",
  projectId: "cedm-santa-teresa-de-avila",
  storageBucket: "cedm-santa-teresa-de-avila.firebasestorage.app",
  messagingSenderId: "1012404980790",
  appId: "1:1012404980790:web:f23fff69681ae8f511dc97"
};

firebase.initializeApp(firebaseConfig);