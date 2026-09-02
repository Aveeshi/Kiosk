/**
 * public/js/book-appointment.js
 * Dictates whatever text is shown on screen at every step of the flow.
 * No mic, no AI analysis — just speaking + basic step navigation.
 */

const dict = window.TRIVIDHA_DICT || {};
const questions = window.TRIVIDHA_QUESTIONS || [];
const lang = window.TRIVIDHA_LANG || 'en-IN';

function speak(text) {
  if (!text) return;
  window.patientAudioDictator.dictate(text, { lang });
}

const els = {
  viewMenu: document.getElementById('view-menu'),
  viewBooking: document.getElementById('view-booking'),
  startBookingBtn: document.getElementById('start-booking-btn'),

  wizQuestion: document.getElementById('wiz-question'),
  wizAutobook: document.getElementById('wiz-autobook'),
  wizConfirm: document.getElementById('wiz-confirm'),

  questionPrompt: document.getElementById('question-prompt'),
  qaProgress: document.getElementById('qa-progress'),
  answerText: document.getElementById('answer-text'),
  answerNextBtn: document.getElementById('answer-next-btn'),

  confirmToken: document.getElementById('confirm-token'),
  confirmSpecialty: document.getElementById('confirm-specialty'),
  confirmWhen: document.getElementById('confirm-when'),
  confirmDoneBtn: document.getElementById('confirm-done-btn')
};

let currentIndex = 0;

// ---- Step A: menu screen ----
speak(dict.menuHeadline);

els.startBookingBtn?.addEventListener('click', () => {
  els.viewMenu.classList.remove('is-active');
  els.viewBooking.classList.add('is-active');
  showQuestion(0);
});

// ---- Step B: questions, one at a time ----
function showQuestion(index) {
  currentIndex = index;
  const q = questions[index];

  if (!q) {
    showAutobook();
    return;
  }

  els.questionPrompt.textContent = q.text;
  if (els.answerText) els.answerText.value = '';
  if (els.qaProgress) els.qaProgress.textContent = `${index + 1} / ${questions.length}`;

  speak(q.text);
}

els.answerNextBtn?.addEventListener('click', () => {
  showQuestion(currentIndex + 1);
});

// ---- Step C: auto-booking screen ----
function showAutobook() {
  els.wizQuestion.classList.remove('is-active');
  els.wizAutobook.classList.add('is-active');

  speak(dict.autobookTitle);

  // Placeholder delay before showing confirmation.
  // Replace with your real booking call when ready.
  setTimeout(() => {
    showConfirmation({
      token: 'T-1234',
      specialty: '—',
      when: '—'
    });
  }, 2000);
}

// ---- Step D: confirmation screen ----
function showConfirmation(data) {
  els.wizAutobook.classList.remove('is-active');
  els.wizConfirm.classList.add('is-active');

  if (els.confirmToken) els.confirmToken.textContent = data.token;
  if (els.confirmSpecialty) els.confirmSpecialty.textContent = data.specialty;
  if (els.confirmWhen) els.confirmWhen.textContent = data.when;

  speak(dict.confirmTitle);
}

els.confirmDoneBtn?.addEventListener('click', () => {
  window.location.href = '/home';
});