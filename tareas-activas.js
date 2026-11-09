(() => {
  "use strict";

  const lista = document.getElementById("lista-tareas-activas");
  const estado = document.getElementById("estado-retiro-tarea");
  const acciones = document.getElementById("acciones-retiro-tarea");
  let actualizarPendiente = false;

  async function solicitar(accion, usuario, datos = {}) {
    const controller = new AbortController();
    let timer;
    try {
      const limite = new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("Tiempo de espera agotado"));
        }, 25000);
      });
      const consulta = (async () => {
        const idToken = await usuario.getIdToken();
        if (controller.signal.aborted) return;
        const respuesta = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          signal: controller.signal,
          body: JSON.stringify({ accion, idToken, datos })
        });
        if (!respuesta.ok) throw new Error("Respuesta HTTP inesperada");
        return respuesta.json();
      })();
      return await Promise.race([consulta, limite]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function cargar(usuario) {
    lista.textContent = "Cargando tareas…";
    try {
      const data = await solicitar("tareas.listar_retirables", usuario);
      if (firebase.auth().currentUser !== usuario) return;
      if (data?.codigo === "NO_AUTORIZADO") {
        window.location.href = "login.html";
        return;
      }
      if (data?.ok !== true || !Array.isArray(data.tareas)) {
        lista.textContent = data?.codigo === "SIN_PERMISO"
          ? "No tenés permiso para administrar tareas."
          : "No pudimos cargar las tareas. Actualizá la lista para volver a intentar.";
        return;
      }

      lista.replaceChildren();
      if (!data.tareas.length) lista.textContent = "No hay tareas activas que puedas retirar.";
      for (const tarea of data.tareas) {
        const fila = document.createElement("div");
        fila.style.cssText = "display:flex;gap:10px;align-items:center;justify-content:space-between;margin:6px 0";
        const titulo = document.createElement("span");
        titulo.textContent = [tarea.curso, tarea.materia, tarea.titulo].filter(Boolean).join(" · ");
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = "Retirar";
        boton.setAttribute("aria-label", "Retirar tarea: " + tarea.titulo);
        boton.addEventListener("click", () => retirar(tarea));
        fila.append(titulo, boton);
        lista.appendChild(fila);
      }
    } catch {
      if (firebase.auth().currentUser === usuario) {
        lista.textContent = "No pudimos cargar las tareas. Actualizá la lista para volver a intentar.";
      }
    }
  }

  function liberarAcciones() {
    acciones.disabled = false;
    if (actualizarPendiente) {
      actualizarPendiente = false;
      actualizar();
    }
  }

  async function actualizar() {
    const usuario = firebase.auth().currentUser;
    if (!usuario?.emailVerified) return;
    if (acciones.disabled) {
      actualizarPendiente = true;
      return;
    }
    acciones.disabled = true;
    try {
      await cargar(usuario);
    } finally {
      liberarAcciones();
    }
  }

  async function retirar(tarea) {
    const usuario = firebase.auth().currentUser;
    if (acciones.disabled || !usuario?.emailVerified) return;
    if (!confirm("¿Deseás retirar la tarea «" + tarea.titulo + "» de la página del curso?")) return;
    acciones.disabled = true;
    estado.className = "estado-msg";
    estado.textContent = "Retirando tarea…";
    try {
      const data = await solicitar("tareas.retirar", usuario, { id: tarea.id });
      if (firebase.auth().currentUser !== usuario) return;
      if (data?.ok === true) {
        estado.className = "estado-msg ok";
        estado.textContent = "Tarea retirada correctamente.";
        await cargar(usuario);
        return;
      }
      if (data?.codigo === "NO_AUTORIZADO") {
        window.location.href = "login.html";
        return;
      }
      estado.className = "estado-msg error";
      if (data?.codigo === "SIN_PERMISO") {
        estado.textContent = "No tenés permiso para retirar esta tarea.";
        await cargar(usuario);
      } else if (data?.codigo === "NO_ENCONTRADO") {
        estado.textContent = "La tarea cambió o ya no está activa.";
        await cargar(usuario);
      } else if (data?.codigo === "LIMITE") {
        estado.textContent = "La solicitud no pudo procesarse ahora. Intentá más tarde.";
      } else {
        estado.textContent = "No pudimos confirmar el retiro. Actualizá la lista antes de volver a intentarlo.";
      }
    } catch {
      if (firebase.auth().currentUser === usuario) {
        estado.className = "estado-msg error";
        estado.textContent = "No pudimos confirmar el retiro. Actualizá la lista antes de volver a intentarlo.";
      }
    } finally {
      liberarAcciones();
    }
  }

  document.getElementById("actualizar-tareas-activas").addEventListener("click", actualizar);
  document.addEventListener("tarea-publicada", actualizar);
  firebase.auth().onAuthStateChanged(usuario => {
    if (usuario?.emailVerified) {
      actualizar();
    } else {
      lista.replaceChildren();
      estado.textContent = "";
    }
  });
})();
