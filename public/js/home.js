// Home page only: the "Scan QR on Your Phone" card opens the QR modal.
// (The "Use This Kiosk" card is a plain <a href="/login">, no JS needed.)
document.addEventListener('DOMContentLoaded', () => {
  const qrBtn = document.getElementById('qr-card-btn');
  const qrModal = document.getElementById('modal-qr');
  if (qrBtn && qrModal && window.TrividhaModals) {
    qrBtn.addEventListener('click', () => window.TrividhaModals.open(qrModal));
  }
});
