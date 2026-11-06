/* El backend decide todos los permisos; la interfaz solo presenta lo autorizado. */
(() => {
  const cont = document.getElementById('gestion-roles');
  const estado = document.getElementById('roles-estado');
  const lista = document.getElementById('roles-lista');
  const actualizar = document.getElementById('roles-actualizar');
  const filtro = document.getElementById('roles-buscar');
  const resumen = document.getElementById('roles-perfil');
  let cuentas = [], operando = false, secuencia = 0;
  function crear(tag, texto, clase) {
    const nodo = document.createElement(tag);
    if (texto !== undefined) nodo.textContent = texto;
    if (clase) nodo.className = clase;
    return nodo;
  }
  const etiquetas = { profesor: 'Profesor', directivo: 'Directivo', admin: 'Administrador' };
  async function solicitar(accion, datos = {}) {
    const user = firebase.auth().currentUser;
    if (!user || !user.emailVerified) throw { codigo: 'NO_AUTORIZADO' };
    const idToken = await user.getIdToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);
    try {
      const resp = await fetch(APPS_SCRIPT_URL, { method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion, idToken, datos }), signal: controller.signal });
      if (!resp.ok) throw new Error('red');
      const data = await resp.json();
      if (!data.ok) throw { codigo: data.codigo };
      return data;
    } finally { clearTimeout(timer); }
  }
  function mensaje(error, escritura = false) {
    const mensajes = {
      NO_AUTORIZADO: 'Tu sesión no está disponible. Volvé a iniciar sesión.',
      SIN_PERMISO: 'Tu cuenta no tiene permiso para realizar esta acción.',
      CONFLICTO: 'La cuenta fue modificada por otra persona. Actualizá la lista antes de continuar.',
      VALIDACION: 'No se pudo validar la información. Revisá la hoja de permisos con el administrador.',
      NO_ENCONTRADO: 'La cuenta ya no existe en permisos. Actualizá la lista.',
      LIMITE: 'Se alcanzó el límite de cambios o el servidor está ocupado. Intentá más tarde.'
    };
    return mensajes[error?.codigo] || (escritura
      ? 'No se pudo confirmar el cambio. Actualizá la lista para verificar el estado antes de volver a intentarlo.'
      : 'No se pudo cargar el panel. Revisá tu conexión y pulsá Actualizar lista.');
  }
  function bloquear(valor) {
    operando = valor;
    actualizar.disabled = valor;
    filtro.disabled = valor;
    lista.querySelectorAll('button,select,input').forEach(n => { n.disabled = valor; });
    cont.setAttribute('aria-busy', String(valor));
  }
  function pintar() {
    const termino = filtro.value.trim().toLocaleLowerCase();
    lista.replaceChildren();
    const visibles = cuentas.filter(c => (c.nombre + ' ' + c.email).toLocaleLowerCase().includes(termino));
    if (!visibles.length) lista.append(crear('p', cuentas.length ? 'No hay coincidencias.' : 'No hay cuentas registradas.'));
    for (const cuenta of visibles) {
      const fila = crear('article', undefined, 'roles-cuenta');
      const identidad = crear('div', undefined, 'roles-identidad');
      identidad.append(crear('strong', cuenta.nombre || 'Sin nombre'), crear('span', cuenta.email));
      fila.append(identidad);
      if (!cuenta.editable) {
        fila.append(crear('p', `${etiquetas[cuenta.rol]} · ${cuenta.activo ? 'Activa' : 'Inactiva'} · Cuenta protegida`));
      } else {
        const etiquetaRol = crear('label', 'Rol');
        const select = crear('select');
        for (const rol of ['profesor', 'directivo']) {
          const option = crear('option', etiquetas[rol]); option.value = rol; select.append(option);
        }
        select.value = cuenta.rol; etiquetaRol.append(select);
        const etiquetaEstado = crear('label', 'Acceso');
        const activo = crear('select');
        for (const [valor, texto] of [['SI', 'Activo'], ['NO', 'Desactivado']]) {
          const option = crear('option', texto); option.value = valor; activo.append(option);
        }
        activo.value = cuenta.activo ? 'SI' : 'NO'; etiquetaEstado.append(activo);
        const guardar = crear('button', 'Guardar cambios'); guardar.type = 'button';
        guardar.addEventListener('click', async () => {
          if (operando) return;
          const datos = { email: cuenta.email, rol: select.value, activo: activo.value === 'SI', version: cuenta.version };
          if (datos.rol === cuenta.rol && datos.activo === cuenta.activo) { estado.textContent = 'No hay cambios para guardar.'; return; }
          const detalle = `${cuenta.nombre || cuenta.email} (${cuenta.email})\nRol: ${etiquetas[cuenta.rol]} → ${etiquetas[datos.rol]}\nAcceso: ${cuenta.activo ? 'Activo' : 'Desactivado'} → ${datos.activo ? 'Activo' : 'Desactivado'}`;
          if (!window.confirm('Confirmar cambio de permisos:\n\n' + detalle)) return;
          bloquear(true); estado.textContent = 'Guardando cambios…';
          let resultado;
          try { await solicitar('roles.cambiar', datos); resultado = 'Cambio guardado y registrado.'; }
          catch(e) { resultado = mensaje(e, true); }
          finally { bloquear(false); }
          // Volver a leer evita presentar un estado supuesto cuando se pierde la respuesta.
          await cargar(resultado);
        });
        fila.append(etiquetaRol, etiquetaEstado, guardar);
      }
      lista.append(fila);
    }
  }
  async function cargar(aviso = '') {
    if (operando) return;
    const turno = ++secuencia;
    bloquear(true); estado.textContent = aviso || 'Cargando cuentas…';
    cuentas = []; lista.replaceChildren();
    try {
      const data = await solicitar('roles.listar');
      if (turno !== secuencia) return;
      cuentas = data.cuentas;
      resumen.textContent = `${data.perfil.nombre} · ${etiquetas[data.perfil.rol]}`;
      pintar(); estado.textContent = aviso || `${cuentas.length} cuentas registradas.`;
    } catch(e) {
      estado.textContent = (aviso ? aviso + ' ' : '') + mensaje(e);
    } finally { if (turno === secuencia) bloquear(false); }
  }
  actualizar.addEventListener('click', () => iniciar());
  filtro.addEventListener('input', pintar);
  async function iniciar() {
    if (operando) return;
    cont.hidden = false; bloquear(true); estado.textContent = 'Comprobando permisos…';
    cuentas = []; lista.replaceChildren();
    try {
      const data = await solicitar('sesion.perfil');
      resumen.textContent = `${data.perfil.nombre} · ${etiquetas[data.perfil.rol]}`;
      if (!data.gestionarRoles) { cont.hidden = true; return; }
      bloquear(false); await cargar();
    } catch(e) { estado.textContent = mensaje(e); }
    finally { bloquear(false); }
  }
  firebase.auth().onAuthStateChanged(user => {
    if (user?.emailVerified) iniciar();
    else { ++secuencia; cuentas = []; lista.replaceChildren(); cont.hidden = true; }
  });
})();
