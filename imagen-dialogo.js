/* Keep the existing image URL handling; add keyboard and focus behavior. */
(() => {
  const dialog = document.getElementById('lightbox');
  if (!dialog) return;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Imagen adjunta');
  let previous;
  new MutationObserver(() => {
    if (dialog.classList.contains('active')) {
      previous = document.activeElement;
      dialog.querySelector('button').focus();
    } else if (previous?.isConnected) previous.focus();
  }).observe(dialog, { attributes: true, attributeFilter: ['class'] });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarLightbox();
    if (e.key === 'Tab') { e.preventDefault(); dialog.querySelector('button').focus(); }
  });
})();
