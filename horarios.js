/* Horario semanal habitual. Los feriados y cambios excepcionales no se deducen. */
const Horarios = (() => {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const normalizar = valor => String(valor ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function minutos(valor) {
    const m = /^(\d{1,2}):(\d{2})(?::00)?$/.exec(String(valor).trim());
    if (!m || +m[1] > 23 || +m[2] > 59) throw new Error('Hora inválida');
    return +m[1] * 60 + +m[2];
  }
  const hora = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  function preparar(filas, curso) {
    if (filas.length && !['curso', 'dia', 'inicio', 'fin', 'materia', 'profesor', 'tipo'].every(k => k in filas[0])) throw new Error('Encabezados inválidos');
    const semana = dias.map(() => []);
    filas.filter(f => normalizar(f.curso) === curso).forEach(f => {
      const d = dias.indexOf(normalizar(f.dia));
      const inicio = minutos(f.inicio), fin = minutos(f.fin), tipo = normalizar(f.tipo);
      if (d < 0 || fin <= inicio || !['clase', 'recreo'].includes(tipo) || (tipo === 'clase' && !String(f.materia).trim())) throw new Error('Bloque inválido');
      semana[d].push({ inicio, fin, tipo, materia: tipo === 'recreo' ? 'Receso' : f.materia.trim(), profesor: String(f.profesor ?? '').trim() });
    });
    return semana.map(bloques => {
      const resultado = [];
      bloques.sort((a, b) => a.inicio - b.inicio).forEach(b => {
        const previo = resultado.at(-1);
        if (previo && previo.fin > b.inicio) throw new Error('Bloques superpuestos');
        if (previo && previo.fin === b.inicio && previo.tipo === b.tipo && previo.materia === b.materia && previo.profesor === b.profesor) previo.fin = b.fin;
        else {
          if (previo && previo.fin < b.inicio) resultado.push({ inicio: previo.fin, fin: b.inicio, tipo: 'libre', materia: 'Sin clases', profesor: '' });
          resultado.push({ ...b });
        }
      });
      return resultado;
    });
  }
  function reloj(fecha = new Date()) {
    const partes = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Asuncion', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(fecha).map(p => [p.type, p.value]));
    return { dia: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(partes.weekday), minuto: +partes.hour * 60 + +partes.minute };
  }
  function estado(semana, ahora) {
    const hoy = semana[ahora.dia] || [];
    const actual = hoy.find(b => b.inicio <= ahora.minuto && ahora.minuto < b.fin);
    let siguiente;
    for (let salto = 0; salto <= 7 && !siguiente; salto++) {
      const dia = (ahora.dia + salto) % 7;
      const bloque = (semana[dia] || []).find(b => b.tipo === 'clase' && (salto > 0 || b.inicio > ahora.minuto));
      if (bloque) siguiente = { ...bloque, dia, salto };
    }
    return { actual, siguiente };
  }
  function el(tag, clase, texto) {
    const nodo = document.createElement(tag);
    nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }
  async function montar(curso, id = 'horarios-contenido') {
    const cont = document.getElementById(id);
    if (!cont) return;
    cont.setAttribute('aria-busy', 'true');
    cont.replaceChildren(el('p', 'estado', 'Cargando horario…'));
    let semana;
    try {
      const cfg = SHEETS_CONFIG.horarios;
      const filas = await cargarHoja(cfg.spreadsheetId, cfg.hoja);
      semana = preparar(filas, curso);
    } catch (error) {
      const mensaje = el('p', 'error-box', 'No se pudo cargar el horario. Revisá la conexión y los datos de la planilla.');
      const reintentar = el('button', 'horarios-boton', 'Reintentar');
      reintentar.type = 'button';
      reintentar.onclick = () => montar(curso, id);
      cont.replaceChildren(mensaje, reintentar);
      cont.setAttribute('aria-busy', 'false');
      return;
    }
    cont.setAttribute('aria-busy', 'false');
    if (!semana.some(d => d.length)) {
      cont.replaceChildren(el('p', 'no-data', 'Horario pendiente de carga'));
      return;
    }
    let seleccionado = Math.min(reloj().dia, 4), vistaSemana = false;
    if (reloj().dia > 4) seleccionado = 0;
    const resumen = el('div', 'horarios-resumen');
    resumen.setAttribute('aria-live', 'polite');
    const controles = el('div', 'horarios-controles');
    controles.setAttribute('aria-label', 'Seleccionar día');
    const botones = nombres.map((nombre, i) => {
      const boton = el('button', 'horarios-boton', nombre.slice(0, 3));
      boton.type = 'button';
      boton.setAttribute('aria-label', nombre);
      boton.onclick = () => { seleccionado = i; vistaSemana = false; pintar(); };
      controles.append(boton);
      return boton;
    });
    const alternar = el('button', 'horarios-boton', 'Ver semana');
    alternar.type = 'button';
    alternar.onclick = () => { vistaSemana = !vistaSemana; pintar(); };
    controles.append(alternar);
    const lista = el('div', 'horarios-lista');
    cont.replaceChildren(resumen, controles, lista, el('p', 'horarios-nota', 'Hora de Paraguay · Horario habitual; no contempla feriados ni cambios excepcionales.'));
    function pintar() {
      const ahora = reloj(), { actual, siguiente } = estado(semana, ahora);
      const textoActual = actual ? (actual.tipo === 'libre' ? `Sin clases hasta ${hora(actual.fin)}` : `${actual.materia} · hasta ${hora(actual.fin)}`) : (semana[ahora.dia]?.length ? 'Fuera del horario de clases' : 'Hoy no hay clases');
      let textoSiguiente = 'No hay clases programadas';
      if (siguiente) {
        const cuando = siguiente.salto === 0 ? '' : `${nombres[siguiente.dia]} `;
        textoSiguiente = `${cuando}${hora(siguiente.inicio)} · ${siguiente.materia}`;
        if (siguiente.salto === 0 && (!actual || actual.tipo === 'libre')) textoSiguiente = `Sin clases hasta ${hora(siguiente.inicio)} · ${siguiente.materia}`;
      }
      const texto = `Ahora: ${textoActual}\nSiguiente: ${textoSiguiente}`;
      if (resumen.textContent !== texto) resumen.textContent = texto;
      botones.forEach((b, i) => {
        b.setAttribute('aria-pressed', String(!vistaSemana && seleccionado === i));
        b.classList.toggle('es-hoy', i === ahora.dia);
      });
      alternar.setAttribute('aria-pressed', String(vistaSemana));
      alternar.textContent = vistaSemana ? 'Ver día' : 'Ver semana';
      lista.classList.toggle('vista-semana', vistaSemana);
      lista.replaceChildren();
      semana.forEach((bloques, d) => {
        if (!vistaSemana && d !== seleccionado) return;
        const columna = el('section', 'horarios-dia');
        columna.classList.toggle('es-hoy', d === ahora.dia);
        columna.append(el('h4', '', nombres[d] + (d === ahora.dia ? ' · Hoy' : '')));
        if (!bloques.length) columna.append(el('p', '', 'Sin clases programadas'));
        let turnoAnterior;
        bloques.forEach(b => {
          const turno = b.inicio < 12 * 60 ? 'Mañana' : 'Tarde';
          if (b.tipo !== 'libre' && turno !== turnoAnterior) {
            columna.append(el('p', 'horarios-turno', turno));
            turnoAnterior = turno;
          }
          const bloque = el('article', `horarios-bloque tipo-${b.tipo}`);
          const activo = d === ahora.dia && b.inicio <= ahora.minuto && ahora.minuto < b.fin;
          if (activo) { bloque.classList.add('es-actual'); bloque.setAttribute('aria-current', 'true'); }
          bloque.append(el('div', 'horarios-hora', `${hora(b.inicio)}–${hora(b.fin)}${activo ? ' · Ahora' : ''}`), el('strong', '', b.materia));
          if (b.profesor && b.tipo === 'clase') bloque.append(el('div', 'horarios-profesor', b.profesor));
          columna.append(bloque);
        });
        lista.append(columna);
      });
    }
    pintar();
    // Actualiza el estado con la hora actual sin consultar Sheets cada minuto.
    const timer = setInterval(() => { if (cont.isConnected) pintar(); else clearInterval(timer); }, 30000);
  }
  return { montar, preparar, reloj, estado, minutos, hora };
})();
