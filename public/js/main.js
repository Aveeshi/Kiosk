// Shared across every page: clock, text-size toggle, and the emergency
// button + shared modal-backdrop (also used for the QR modal on the home
// page). Page-specific scripts (home.js, login.js, book-appointment.js)
// build on top of window.TrividhaModals defined at the bottom here.

// ============ CLOCK ============
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeEl = document.getElementById('clock-time');
  const dateEl = document.getElementById('clock-date');
  if (timeEl) timeEl.textContent = time;
  if (dateEl) dateEl.textContent = date;
}
updateClock();
setInterval(updateClock, 1000 * 15);

// ============ TEXT SIZE TOGGLE ============
let step = parseFloat(localStorage.getItem('trividha-step')) || 1;
document.documentElement.style.setProperty('--step', step);

const biggerBtn = document.getElementById('text-larger');
const smallerBtn = document.getElementById('text-smaller');
if (biggerBtn) {
  biggerBtn.addEventListener('click', () => {
    step = Math.min(step + 0.1, 1.4);
    document.documentElement.style.setProperty('--step', step);
    localStorage.setItem('trividha-step', step);
  });
}
if (smallerBtn) {
  smallerBtn.addEventListener('click', () => {
    step = Math.max(step - 0.1, 0.9);
    document.documentElement.style.setProperty('--step', step);
    localStorage.setItem('trividha-step', step);
  });
}

// ============ EMERGENCY BUTTON + SHARED MODAL BACKDROP ============
const backdrop = document.getElementById('modal-backdrop');
const emergencyBtn = document.getElementById('emergency-btn');
const emergencyModal = document.getElementById('modal-emergency');

function openModalEl(modalEl) {
  if (!backdrop || !modalEl) return;
  backdrop.classList.add('is-open');
  modalEl.classList.add('is-open');
}
function closeAllModals() {
  if (!backdrop) return;
  backdrop.classList.remove('is-open');
  backdrop.querySelectorAll('.modal').forEach((m) => m.classList.remove('is-open'));
}

if (emergencyBtn) emergencyBtn.addEventListener('click', () => openModalEl(emergencyModal));
document.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeAllModals));
if (backdrop) backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeAllModals(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

// Exposed so page-specific scripts (e.g. the QR card on home.ejs) can open
// modals that live on their page without duplicating this logic.
window.TrividhaModals = { open: openModalEl, closeAll: closeAllModals };
