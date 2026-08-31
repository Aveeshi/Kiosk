// Book-appointment page: post-login menu -> AI Q&A wizard -> POST
// /api/autobook -> confirmation, then auto-redirect back to /home for the
// next patient.
const dict = window.TRIVIDHA_DICT || {};
const QUESTIONS = window.TRIVIDHA_QUESTIONS || [];

function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('is-active'));
  document.getElementById(`view-${name}`).classList.add('is-active');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

document.getElementById('wizard-back-btn').addEventListener('click', () => showView('menu'));
document.getElementById('start-booking-btn').addEventListener('click', () => {
  showView('booking');
  resetQA();
});

// ============ AI Q&A ============
let qaState = { answers: {}, currentIndex: 0 };

const qaProgressEl = document.getElementById('qa-progress');
const questionPromptEl = document.getElementById('question-prompt');
const questionChipsEl = document.getElementById('question-chips');
const answerTextEl = document.getElementById('answer-text');
const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');

function resetQA() {
  qaState = { answers: {}, currentIndex: 0 };
  buildQaDots();
  showWizardStep('question');
  renderCurrentQuestion();
}

function buildQaDots() {
  qaProgressEl.innerHTML = '';
  QUESTIONS.forEach(() => {
    const dot = document.createElement('span');
    dot.className = 'qa-dot';
    qaProgressEl.appendChild(dot);
  });
}
function updateQaDots() {
  const dots = qaProgressEl.querySelectorAll('.qa-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === qaState.currentIndex);
    dot.classList.toggle('is-done', i < qaState.currentIndex);
  });
}

function showWizardStep(stepName) {
  document.querySelectorAll('#view-booking .wizard-step').forEach((s) => s.classList.remove('is-active'));
  document.getElementById(`wiz-${stepName}`).classList.add('is-active');
}

function renderCurrentQuestion() {
  const q = QUESTIONS[qaState.currentIndex];
  updateQaDots();
  questionPromptEl.textContent = dict[q.promptKey] || q.key;
  answerTextEl.placeholder = dict[q.placeholderKey] || '';
  answerTextEl.value = qaState.answers[q.key] || '';
  setMicStatus('idle');

  questionChipsEl.innerHTML = '';
  if (q.chips) {
    q.chips.forEach((chipKey) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip-btn';
      chip.textContent = dict[chipKey];
      if (answerTextEl.value === dict[chipKey]) chip.classList.add('is-selected');
      chip.addEventListener('click', () => {
        answerTextEl.value = dict[chipKey];
        questionChipsEl.querySelectorAll('.chip-btn').forEach((c) => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');
      });
      questionChipsEl.appendChild(chip);
    });
  }
}

const micStatusDefaults = { idle: 'Tap to speak', listening: 'Listening…', done: 'Got it' };
function setMicStatus(state) {
  const map = { idle: 'micIdle', listening: 'micListening', done: 'micDone' };
  micStatus.textContent = dict[map[state]] || micStatusDefaults[state];
  micBtn.classList.toggle('is-listening', state === 'listening');
}

let recognition = null;
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognitionAPI) {
  recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e) => {
    answerTextEl.value = e.results[0][0].transcript;
    setMicStatus('done');
  };
  recognition.onerror = () => setMicStatus('idle');
  recognition.onend = () => micBtn.classList.remove('is-listening');
}

const DEMO_ANSWERS = [
  "I've had a fever and sore throat since yesterday",
  'Since yesterday morning',
  "Moderate, it's been uncomfortable"
];

micBtn.addEventListener('click', () => {
  if (recognition) {
    try {
      const langMap = { hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', ur: 'ur-IN' };
      recognition.lang = langMap[document.documentElement.lang] || 'en-IN';
      setMicStatus('listening');
      recognition.start();
    } catch (err) {
      setMicStatus('idle');
    }
  } else {
    setMicStatus('listening');
    setTimeout(() => {
      answerTextEl.value = DEMO_ANSWERS[qaState.currentIndex] || DEMO_ANSWERS[0];
      setMicStatus('done');
    }, 1600);
  }
});

document.getElementById('answer-next-btn').addEventListener('click', () => {
  const q = QUESTIONS[qaState.currentIndex];
  const text = answerTextEl.value.trim();
  qaState.answers[q.key] = text || DEMO_ANSWERS[qaState.currentIndex] || '';

  if (qaState.currentIndex < QUESTIONS.length - 1) {
    qaState.currentIndex += 1;
    renderCurrentQuestion();
  } else {
    runAutoBook();
  }
});

// ============ AUTO-BOOK (server-side matching + slot finding) ============
async function runAutoBook() {
  showWizardStep('autobook');
  try {
    const res = await fetch('/api/autobook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qaState.answers)
    });
    const data = await res.json();

    if (!data.ok) {
      window.location.href = '/login';
      return;
    }

    document.getElementById('confirm-specialty').textContent = data.specialty;
    document.getElementById('confirm-when').textContent = data.when;
    document.getElementById('confirm-token').textContent = data.token;

    showWizardStep('confirm');
    startRedirectCountdown();
  } catch (err) {
    showWizardStep('question');
  }
}

// ---- auto-redirect to home for next patient ----
let redirectInterval = null;
function startRedirectCountdown() {
  let secondsLeft = 10;
  const el = document.getElementById('redirect-seconds');
  el.textContent = secondsLeft;
  clearInterval(redirectInterval);
  redirectInterval = setInterval(() => {
    secondsLeft -= 1;
    el.textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(redirectInterval);
      window.location.href = '/logout';
    }
  }, 1000);
}
document.getElementById('confirm-done-btn').addEventListener('click', () => {
  clearInterval(redirectInterval);
  window.location.href = '/logout';
});
