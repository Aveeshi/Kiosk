// Finds the next bookable slot inside the kiosk's morning/afternoon
// clinic windows, rounded up to the nearest 15-minute increment.
const MORNING_START = 9 * 60;
const MORNING_END = 12 * 60;
const AFTERNOON_START = 14 * 60;
const AFTERNOON_END = 17 * 60;

function nextAvailableSlot(now = new Date()) {
  const d = new Date(now);
  let minutesNow = d.getHours() * 60 + d.getMinutes();
  minutesNow = Math.ceil(minutesNow / 15) * 15;

  if (minutesNow < MORNING_START) {
    minutesNow = MORNING_START;
  } else if (minutesNow >= MORNING_END && minutesNow < AFTERNOON_START) {
    minutesNow = AFTERNOON_START;
  } else if (minutesNow >= AFTERNOON_END) {
    d.setDate(d.getDate() + 1);
    minutesNow = MORNING_START;
  }

  const hh = Math.floor(minutesNow / 60).toString().padStart(2, '0');
  const mm = (minutesNow % 60).toString().padStart(2, '0');
  return { date: d, time: `${hh}:${mm}` };
}

module.exports = { nextAvailableSlot };
