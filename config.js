// ============================================================
//  CONFIGURACIÓN — CEDM Santa Teresa de Ávila
//  Solo edita este archivo cuando cambies los Sheets.
// ============================================================

const SHEETS_CONFIG = {

  // ----------------------------------------------------------
  // INSTRUCCIONES:
  // 1. Abre tu Google Sheet
  // 2. Copia la URL, que tiene esta forma:
  //    https://docs.google.com/spreadsheets/d/XXXXXXXXXXX/edit
  // 3. El ID es la parte XXXXXXXXXXX
  // 4. Pégala entre las comillas de cada curso abajo
  // ----------------------------------------------------------

  primero: {
    spreadsheetId: "PON_AQUI_EL_ID_DEL_SHEET_DE_1ER_CURSO",
    // Nombre exacto de cada pestaña dentro del Sheet:
    hojas: {
      avisos:   "Avisos",
      tareas:   "Tareas",
      horarios: "Horarios",
    }
  },

  segundo: {
    spreadsheetId: "PON_AQUI_EL_ID_DEL_SHEET_DE_2DO_CURSO",
    hojas: {
      avisos:   "Avisos",
      tareas:   "Tareas",
      horarios: "Horarios",
    }
  },

  tercero: {
    spreadsheetId: "PON_AQUI_EL_ID_DEL_SHEET_DE_3ER_CURSO",
    hojas: {
      avisos:   "Avisos",
      tareas:   "Tareas",
      horarios: "Horarios",
    }
  },

};

// ============================================================
//  FUNCIÓN UNIVERSAL — lee cualquier pestaña de cualquier Sheet
//  Devuelve un array de objetos con las filas del CSV.
// ============================================================
async function cargarHoja(spreadsheetId, nombreHoja) {
  const hoja = encodeURIComponent(nombreHoja);
  const url  = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${hoja}`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`No se pudo cargar la hoja "${nombreHoja}"`);

  const texto = await resp.text();
  return parsearCSV(texto);
}

// Parser CSV simple (maneja comillas)
function parsearCSV(texto) {
  const lineas = texto.trim().split("\n");
  if (lineas.length < 2) return [];

  const encabezados = parsearLinea(lineas[0]);
  const filas = [];

  for (let i = 1; i < lineas.length; i++) {
    const valores = parsearLinea(lineas[i]);
    if (valores.every(v => v.trim() === "")) continue; // omite filas vacías
    const fila = {};
    encabezados.forEach((h, idx) => {
      fila[h.trim()] = (valores[idx] || "").trim();
    });
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
    if (c === '"') {
      dentroComillas = !dentroComillas;
    } else if (c === "," && !dentroComillas) {
      resultado.push(actual);
      actual = "";
    } else {
      actual += c;
    }
  }
  resultado.push(actual);
  return resultado;
}