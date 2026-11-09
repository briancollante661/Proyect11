/* Navigation never grants permission; only roles.js relays the server result. */
(() => {
  const nav = document.getElementById('docente-nav');
  const menu = document.getElementById('docente-menu');
  const title = document.getElementById('docente-titulo');
  const views = document.getElementById('docente-vistas');
  let authorized = false, section = 'tareas';
  const selected = { tareas: 'publicar', avisos: 'publicar' };
  function closeMenu(focus = false) {
    nav.classList.remove('abierto'); menu.setAttribute('aria-expanded', 'false');
    if (focus) menu.focus();
  }
  function render() {
    if (section === 'permisos' && !authorized) section = 'tareas';
    for (const id of ['tareas', 'avisos', 'permisos']) {
      document.getElementById('docente-' + id).hidden = id !== section;
      const button = nav.querySelector(`[data-seccion="${id}"]`);
      if (id === section) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    title.textContent = { tareas: 'Tareas', avisos: 'Avisos', permisos: 'Permisos' }[section];
    views.hidden = section === 'permisos';
    views.querySelector('[data-vista="publicadas"]').textContent = section === 'avisos' ? 'Publicados' : 'Publicadas';
    views.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vista === selected[section])));
    for (const id of ['tareas', 'avisos']) document.getElementById('docente-' + id).querySelectorAll('[data-panel-vista]').forEach(p => { p.hidden = p.dataset.panelVista !== selected[id]; });
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('abierto', open); menu.setAttribute('aria-expanded', String(open));
    if (open) nav.querySelector('[aria-current]').focus();
  });
  nav.addEventListener('click', e => {
    const button = e.target.closest('[data-seccion]');
    if (!button || (button.dataset.seccion === 'permisos' && !authorized)) return;
    section = button.dataset.seccion; render(); closeMenu(); title.focus();
  });
  views.addEventListener('click', e => {
    const button = e.target.closest('[data-vista]');
    if (button && section !== 'permisos') { selected[section] = button.dataset.vista; render(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('abierto')) closeMenu(true); });
  document.addEventListener('click', e => { if (nav.classList.contains('abierto') && !nav.contains(e.target) && !menu.contains(e.target)) closeMenu(true); });
  document.addEventListener('sie-permisos', e => {
    authorized = e.detail.autorizado === true;
    nav.querySelector('[data-seccion="permisos"]').hidden = !authorized;
    render();
  });
  render();
})();
