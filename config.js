// ============================================================
//  CONFIGURACION — CEDM Santa Teresa de Avila
// ============================================================

const SHEETS_CONFIG = {

  avisos: {
    spreadsheetId:
      "1xt5ep0wThwCWtr9Xz3y5pliaPhboC8bbfiTFrDIyxsc",
    hoja: "avisos"
  },

  tareas: {
    spreadsheetId: "18iAw-IVW-9NW3gVJmJzQHw0U8m7UCGEDa1Yi3X4zOHk",
    hoja: "tareas"
  },

  horarios: {
    spreadsheetId: "1xt5ep0wThwCWtr9Xz3y5pliaPhboC8bbfiTFrDIyxsc",
    hoja: "horarios"
  }

};

async function cargarHoja(spreadsheetId, nombreHoja) {
  const hoja = encodeURIComponent(nombreHoja);
  const url = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/gviz/tq?tqx=out:csv&headers=1&sheet=' + hoja;
  const controller = new AbortController();
  let timer;
  try {
    const limite = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('Tiempo de lectura agotado'));
        controller.abort();
      }, 15000);
    });
    const lectura = (async () => {
      const resp = await fetch(url, { signal: controller.signal });
      if (!resp.ok) throw new Error('Respuesta de lectura inválida');
      return parsearCSV(await resp.text());
    })();
    return await Promise.race([lectura, limite]);
  } finally {
    clearTimeout(timer);
  }
}

// Solo texto controlado: los detalles técnicos no se insertan en la página.
function mostrarCargando(cont, mensaje) {
  if (!cont) return;
  const estado = document.createElement('div');
  estado.className = 'estado';
  estado.setAttribute('role', 'status');
  estado.textContent = mensaje;
  cont.setAttribute('aria-busy', 'true');
  cont.replaceChildren(estado);
}

function mostrarErrorLectura(cont, recurso, reintentar) {
  if (!cont) return;
  cont.setAttribute('aria-busy', 'false');
  const caja = document.createElement('div');
  caja.className = 'error-box';
  caja.setAttribute('role', 'status');
  const mensaje = document.createElement('p');
  mensaje.textContent = 'No se pudieron cargar ' + recurso + '. Revisá tu conexión o intentá de nuevo en unos momentos.';
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = 'Reintentar';
  boton.style.cssText = 'margin-top:10px;padding:10px 16px;min-height:44px;cursor:pointer;font:inherit;';
  boton.addEventListener('click', async () => {
    boton.disabled = true;
    boton.textContent = 'Cargando…';
    try { await reintentar(); }
    catch { mostrarErrorLectura(cont, recurso, reintentar); }
    finally { boton.disabled = false; boton.textContent = 'Reintentar'; }
  });
  caja.append(mensaje, boton);
  cont.replaceChildren(caja);
}

function parsearCSV(texto) {
  const filas = [];
  let fila = [], campo = "", comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo); campo = "";
      filas.push(fila); fila = [];
    } else campo += c;
  }
  if (campo !== "" || fila.length) { fila.push(campo); filas.push(fila); }
  if (filas.length < 2) return [];
  const encabezados = filas[0].map(h => h.trim());
  return filas.slice(1)
    .filter(v => !v.every(x => x.trim() === ""))
    .map(v => {
      const o = {};
      encabezados.forEach((h, i) => { o[h] = (v[i] || "").trim(); });
      return o;
    });
}

function parsearLinea(linea) {
  const resultado = [];
  let actual = "";
  let dentroComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') { dentroComillas = !dentroComillas; }
    else if (c === "," && !dentroComillas) { resultado.push(actual); actual = ""; }
    else { actual += c; }
  }
  resultado.push(actual);
  return resultado;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function cargarAvisosCurso(curso, contenedorId) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  mostrarCargando(cont, 'Cargando avisos…');
  const TIPOS = { evento: "Evento", cambio_horario: "Cambio de horario", otro: "Aviso" };
  const fmt = (iso) => new Date(iso.slice(0, 10) + "T00:00:00")
    .toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const crear = (tag, clase, texto) => {
    const el = document.createElement(tag);
    el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  };
  try {
    const hoy = new Date().toLocaleDateString("sv-SE");
    const filas = (await cargarHoja(SHEETS_CONFIG.avisos.spreadsheetId, SHEETS_CONFIG.avisos.hoja))
      .filter(f => f.estado === "activo" &&
        (f.curso === "general" || f.curso === curso) &&
        (!f.vigente_hasta || f.vigente_hasta >= hoy))
      .sort((a, b) => b.publicado_en.localeCompare(a.publicado_en));

    cont.setAttribute('aria-busy', 'false');
    cont.textContent = "";
    if (!filas.length) {
      cont.appendChild(crear("div", "no-data", "No hay avisos por ahora."));
      return;
    }
    filas.forEach((f, i) => {
      const meta = crear("div", "tarea-meta");
      meta.append(
        crear("span", "tarea-meta-materia",
          (TIPOS[f.tipo] || "Aviso") + (f.curso === "general" ? " · General" : "")),
        crear("div", "tarea-meta-sep"),
        crear("span", "tarea-meta-fecha",
          f.fecha_evento ? "Fecha: " + fmt(f.fecha_evento) : "Publicado: " + fmt(f.publicado_en))
      );
      const body = crear("div", "tarea-body");
      body.append(meta, crear("div", "tarea-titulo", f.titulo), crear("div", "tarea-desc", f.descripcion));
      const card = crear("div", "tarea-card");
      card.style.animationDelay = (i * 0.06) + "s";
      card.append(crear("div", "tarea-acento"), body);
      cont.appendChild(card);
    });
  } catch (e) {
    mostrarErrorLectura(cont, "los avisos", () => cargarAvisosCurso(curso, contenedorId));
  }
}


// ============================================================
//  TEMA CLARO / OSCURO — Sesión actual (inicia siempre en claro)
// ============================================================
(function inicializarTemaSIE() {
  const SESSION_KEY = 'sie-theme';

  try {
    localStorage.removeItem(SESSION_KEY);
  } catch { }

  function leerTemaSesion() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  function actualizarBotonesTema(tema) {
    const esOscuro = tema === 'dark';
    const etiqueta = esOscuro ? 'Activar modo claro' : 'Activar modo oscuro';
    const textoBoton = esOscuro ? 'Modo claro' : 'Modo oscuro';
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-label', etiqueta);
      btn.setAttribute('title', etiqueta);
      btn.setAttribute('aria-pressed', String(esOscuro));
      const label = btn.querySelector('[data-theme-label]');
      if (label) label.textContent = textoBoton;
    });
  }

  function aplicarTema(tema, guardarEnSesion) {
    const modo = tema === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', modo);
    document.documentElement.style.colorScheme = modo;
    if (guardarEnSesion) {
      try {
        sessionStorage.setItem(SESSION_KEY, modo);
      } catch { }
    }
    actualizarBotonesTema(modo);
  }

  aplicarTema(leerTemaSesion(), false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => aplicarTema(leerTemaSesion(), false));
  } else {
    actualizarBotonesTema(leerTemaSesion());
  }

  window.addEventListener('pageshow', () => {
    aplicarTema(leerTemaSesion(), false);
  });

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-theme-toggle]');
    if (!btn) return;
    const actual = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    aplicarTema(actual === 'dark' ? 'light' : 'dark', true);
  });
})();
