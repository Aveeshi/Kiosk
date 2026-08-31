// AI Q&A wizard questions. `promptKey`/`placeholderKey`/`chips` are keys
// into model/translations.js so the wizard stays fully localized.
module.exports = [
  { key: 'symptoms', promptKey: 'q1Prompt', placeholderKey: 'q1Placeholder', chips: null },
  { key: 'duration',  promptKey: 'q2Prompt', placeholderKey: 'q2Placeholder', chips: null },
  { key: 'severity',  promptKey: 'q3Prompt', placeholderKey: 'q3Placeholder', chips: ['chipMild', 'chipModerate', 'chipSevere'] }
];
