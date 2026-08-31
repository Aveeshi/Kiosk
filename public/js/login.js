// Login page: ABHA ID / mobile keypad -> POST /api/send-otp -> OTP keypad
// -> POST /api/verify-otp -> redirect to /book-appointment on success.
const dict = window.TRIVIDHA_DICT || {};

const stepId = document.getElementById('login-step-id');
const stepOtp = document.getElementById('login-step-otp');
const stepSuccess = document.getElementById('login-step-success');

const idDisplay = document.getElementById('id-display');
const abhaError = document.getElementById('abha-error');
const otpBoxes = Array.from(document.querySelectorAll('.otp-box'));
const otpError = document.getElementById('otp-error');
const maskedNumber = document.getElementById('otp-masked-number');
const resendBtn = document.getElementById('resend-otp-btn');

let idDigits = '';
let otpDigits = '';
let resendInterval = null;

function formatGrouped(digits) {
  return digits.replace(/(.{4})/g, '$1 ').trim();
}
function renderIdDisplay() {
  if (idDigits.length === 0) {
    idDisplay.innerHTML = `<span class="id-display-placeholder">${dict.loginLabel || 'ABHA ID / Mobile Number'}</span>`;
  } else {
    idDisplay.textContent = formatGrouped(idDigits);
  }
}
function renderOtpDisplay() {
  otpBoxes.forEach((box, i) => { box.value = otpDigits[i] || ''; });
}
function showStep(step) {
  [stepId, stepOtp, stepSuccess].forEach((s) => s.classList.remove('is-active'));
  step.classList.add('is-active');
}

document.querySelectorAll('.keypad-btn[data-digit]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (idDigits.length >= 14) return;
    idDigits += btn.dataset.digit;
    idDisplay.classList.remove('has-error');
    abhaError.classList.remove('is-visible');
    renderIdDisplay();
  });
});
document.getElementById('keypad-clear').addEventListener('click', () => {
  idDigits = '';
  renderIdDisplay();
  idDisplay.classList.remove('has-error');
  abhaError.classList.remove('is-visible');
});
document.getElementById('keypad-back').addEventListener('click', () => {
  idDigits = idDigits.slice(0, -1);
  renderIdDisplay();
});

function setResendCounting(secondsLeft) {
  resendBtn.disabled = true;
  resendBtn.innerHTML = `Resend OTP in <span id="resend-timer">${secondsLeft}</span>s`;
}
function setResendReady() {
  resendBtn.disabled = false;
  resendBtn.textContent = 'Resend OTP';
}
function startResendCountdown() {
  let secondsLeft = 30;
  setResendCounting(secondsLeft);
  clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft <= 0) { clearInterval(resendInterval); setResendReady(); }
    else { setResendCounting(secondsLeft); }
  }, 1000);
}

document.getElementById('send-otp-btn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idDigits })
    });
    const data = await res.json();

    if (!data.ok) {
      abhaError.classList.add('is-visible');
      idDisplay.classList.add('has-error');
      return;
    }

    abhaError.classList.remove('is-visible');
    idDisplay.classList.remove('has-error');
    maskedNumber.textContent = data.maskedNumber;

    showStep(stepOtp);
    otpDigits = '';
    renderOtpDisplay();
    startResendCountdown();
  } catch (err) {
    abhaError.classList.add('is-visible');
    idDisplay.classList.add('has-error');
  }
});

document.querySelectorAll('.keypad-btn[data-otp-digit]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (otpDigits.length >= 6) return;
    otpDigits += btn.dataset.otpDigit;
    otpBoxes.forEach((b) => b.classList.remove('has-error'));
    otpError.classList.remove('is-visible');
    renderOtpDisplay();
  });
});
document.getElementById('otp-keypad-clear').addEventListener('click', () => { otpDigits = ''; renderOtpDisplay(); });
document.getElementById('otp-keypad-back').addEventListener('click', () => { otpDigits = otpDigits.slice(0, -1); renderOtpDisplay(); });

document.getElementById('verify-otp-btn').addEventListener('click', async () => {
  if (otpDigits.length !== 6) {
    otpError.classList.add('is-visible');
    otpBoxes.forEach((b, i) => { if (!otpDigits[i]) b.classList.add('has-error'); });
    return;
  }

  try {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: otpDigits })
    });
    const data = await res.json();

    if (!data.ok) {
      otpError.classList.add('is-visible');
      return;
    }

    clearInterval(resendInterval);
    showStep(stepSuccess);
    setTimeout(() => { window.location.href = data.redirect || '/book-appointment'; }, 1400);
  } catch (err) {
    otpError.classList.add('is-visible');
  }
});

document.getElementById('resend-otp-btn').addEventListener('click', () => {
  if (resendBtn.disabled) return;
  otpDigits = '';
  renderOtpDisplay();
  startResendCountdown();
});

document.getElementById('change-id-btn').addEventListener('click', () => {
  showStep(stepId);
  idDigits = '';
  renderIdDisplay();
  otpDigits = '';
  renderOtpDisplay();
  clearInterval(resendInterval);
});

renderIdDisplay();
