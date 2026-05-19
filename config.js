// ============================================================
//  CONFIGURACION — CEDM Santa Teresa de Avila
// ============================================================

const SHEETS_CONFIG = {

  avisos: {
    spreadsheetId: "1aYJ0ZukO-DxzZN77sWMgmzhvsHRQXfsjdDUXel_jE2A",
    hoja: "Avisos"
  },

  tareas: {
    spreadsheetId: "18iAw-IVW-9NW3gVJmJzQHw0U8m7UCGEDa1Yi3X4zOHk",
    hoja: "Tareas"
  },

  horarios: {
    spreadsheetId: "1xt5ep0wThwCWtr9Xz3y5pliaPhboC8bbfiTFrDIyxsc",
    hojas: {
      primero: "Primero",
      segundo: "Segundo",
      tercero: "Tercero"
    }
  }

};

async function cargarHoja(spreadsheetId, nombreHoja) {
  const hoja = encodeURIComponent(nombreHoja);
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${hoja}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`No se pudo cargar: ${nombreHoja}`);
  const texto = await resp.text();
  return parsearCSV(texto);
}

function parsearCSV(texto) {
  const lineas = texto.trim().split("\n");
  if (lineas.length < 2) return [];
  const encabezados = parsearLinea(lineas[0]);
  const filas = [];
  for (let i = 1; i < lineas.length; i++) {
    const valores = parsearLinea(lineas[i]);
    if (valores.every(v => v.trim() === "")) continue;
    const fila = {};
    encabezados.forEach((h, idx) => { fila[h.trim()] = (valores[idx] || "").trim(); });
    filas.push(fila);
  }
  return filas;
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