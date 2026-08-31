// Keyword -> specialty map used by the AI Q&A auto-booking flow.
// The first entry is also the fallback when nothing else matches.
module.exports = [
  { id: 'general',      label: 'General Medicine',  keywords: ['fever', 'cold', 'cough', 'weak', 'tired', 'body ache', 'flu'] },
  { id: 'cardiology',   label: 'Cardiology',         keywords: ['chest', 'heart', 'palpitation', 'breathless'] },
  { id: 'orthopedics',  label: 'Orthopedics',        keywords: ['bone', 'joint', 'knee', 'back pain', 'fracture', 'sprain'] },
  { id: 'pediatrics',   label: 'Pediatrics',         keywords: ['child', 'baby', 'infant', 'kid'] },
  { id: 'ent',          label: 'ENT',                keywords: ['ear', 'throat', 'sinus', 'nose', 'sore throat'] },
  { id: 'dermatology',  label: 'Dermatology',        keywords: ['skin', 'rash', 'itch', 'acne'] },
  { id: 'gynecology',   label: 'Gynecology',         keywords: ['pregnan', 'menstrual', 'period'] },
  { id: 'neurology',    label: 'Neurology',          keywords: ['headache', 'migraine', 'dizziness', 'seizure', 'numbness'] },
  { id: 'ophthalmology',label: 'Ophthalmology',      keywords: ['eye', 'vision', 'blurry'] },
  { id: 'dentistry',    label: 'Dentistry',          keywords: ['tooth', 'teeth', 'gum', 'dental'] },
  { id: 'gastro',       label: 'Gastroenterology',   keywords: ['stomach', 'abdomen', 'nausea', 'vomit', 'diarrh'] },
  { id: 'psychiatry',   label: 'Psychiatry',         keywords: ['anxious', 'anxiety', 'stress', 'sleep', 'depress'] }
];
