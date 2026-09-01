const { getGeminiClient } = require("../utils/gemini");
const { cleanJsonString } = require("../utils/textUtils");
const { generateSmartFallbackDialogue, generateSmartFallbackSummary } = require("../utils/fallbacks");

const handleDialogue = async (req, res) => {
  try {
    const {
      patient,
      language = { code: "en", label: "English" },
      messages = [],
      currentStage = "CHIEF_COMPLAINT",
      extractedData = {},
    } = req.body;

    const patientContext = patient
      ? `
Patient Profile:
Name: ${patient.name || "Patient"} (${patient.age || "?"} yrs, ${patient.gender || "Unspecified"})
Known Chronic Conditions: ${patient.knownRecords?.chronicConditions?.join(", ") || "None on file"}
Known Allergies: ${patient.knownRecords?.allergies?.join(", ") || "None on file (NKDA)"}
Known Current Medications: ${patient.knownRecords?.currentMedications?.join(", ") || "None on file"}
Known Past Surgeries: ${patient.knownRecords?.pastSurgeries?.join(", ") || "None on file"}
Last Hospital Visit: ${patient.knownRecords?.lastVisitReason || "None"}
`
      : `Patient Profile: New Patient (No existing records stored)`;

    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const turnCount = userMessages.length;

    const previousQuestionsAsked = assistantMessages.map((m) => m.content);
    const lastPatientMessage = userMessages[userMessages.length - 1]?.content || "";

    const conversationHistoryText = messages
      .map(
        (m) =>
          `${m.role === "assistant" ? "Assistant (Doctor's AI)" : "Patient"}: "${m.content}"`
      )
      .join("\n");

    const turnRoadmap = [
      { turn: 1, topic: "Clinical Subtype, Specific Joint/Location (if not yet stated), or Duration & Onset details", stage: "CHIEF_COMPLAINT" },
      { turn: 2, topic: "Morning stiffness duration, daily diurnal patterns, or continuous vs episodic timing", stage: "SYMPTOM_EXPLORATION" },
      { turn: 3, topic: "Pain Severity (Rating on 1-10 scale) & Sensation Character (throbbing, burning, dull, sharp, grinding)", stage: "SEVERITY_IMPACT" },
      { turn: 4, topic: "Functional Impact on Daily Living (walking, climbing stairs, gripping items, working, sleep)", stage: "FUNCTIONAL_IMPACT" },
      { turn: 5, topic: "Aggravating & Relieving Factors (movement vs rest, cold weather vs warmth, diet, postures)", stage: "SEVERITY_IMPACT" },
      { turn: 6, topic: "Treatments, Painkillers, Gels or Prescriptions tried so far and response", stage: "CLINICAL_HISTORY" },
      { turn: 7, topic: "Associated Systemic Symptoms (fever, rashes, numbness, eye redness) & Chronic Conditions / Drug Allergies", stage: "SAFETY_CHECK" },
      { turn: 8, topic: "Intake Complete - Warm handoff to physician", stage: "COMPLETE" }
    ];

    const currentTurnInfo = turnRoadmap[Math.min(turnCount, 7)] || turnRoadmap[7];
    const isFinalTurn = turnCount >= 7;

    const systemPrompt = `
You are CareIntake AI, an empathetic, highly attentive multilingual clinical pre-intake voice assistant at a medical hospital.
You are speaking directly to a patient in real time before they see their physician.

PATIENT'S CHOSEN SPOKEN LANGUAGE:
- Language: "${language.label}" (${language.code})
- CRITICAL: All questions and responses in 'assistantMessage' and 'quickReplies' MUST be completely translated and written in the native ${language.label.toUpperCase()} script.
- NEVER output English in 'assistantMessage' or 'quickReplies' when the chosen language is not English.
- Note: Patients may reply in the native script, in Romanized transliteration, or mixed with English medical words. You MUST understand all of these seamlessly!

CURRENT INTERVIEW STATUS:
- Total Patient Answers Received: ${turnCount}
- Current Question Number: ${Math.min(turnCount + 1, 8)} of 8
- Designated Clinical Dimension for THIS Turn: "${currentTurnInfo.topic}"
- Target Clinical Stage: ${currentTurnInfo.stage}
- Is Final Wrap-Up Turn: ${isFinalTurn}

CRITICAL NON-REPETITION RULES:
1. STRICT NON-REPETITION MANDATE:
   - Carefully review the entire conversation history and the PREVIOUS QUESTIONS ALREADY ASKED below.
   - YOU MUST NEVER RE-ASK OR PARAPHRASE ANY QUESTION FROM THAT LIST.
   - If the patient ALREADY mentioned which joints (e.g. knees) or body part hurts, DO NOT ask which joints hurt.
   - If the patient ALREADY stated the duration (e.g. 2 weeks) or pain rating (e.g. 8/10), DO NOT ask how long or for a rating again.
   - Always advance forward to the next unaddressed clinical dimension.

2. ACTIVE LISTENING & STEP-FORWARD ACKNOWLEDGEMENT:
   - Start your response by briefly acknowledging the patient's LATEST statement in 3 to 6 comforting words in ${language.label}.
   - Immediately transition to the DESIGNATED CLINICAL DIMENSION for this turn ("${currentTurnInfo.topic}") in ${language.label}.

3. NATURAL 7-8 TURN FLOW:
   - Turn 1: Specific Subtype / Exact Anatomy (if unstated) or Onset Chronology
   - Turn 2: Morning Stiffness Duration & Daily Pattern
   - Turn 3: Sensation Character & Pain Rating (1-10)
   - Turn 4: Functional Impact (work, walking, grip, sleep)
   - Turn 5: Triggers & Relieving Factors (cold/heat, rest/movement)
   - Turn 6: Medications, Ointments or Home remedies tried
   - Turn 7: Systemic symptoms (fever, tingling, rash) & Known Allergies/Conditions
   - Turn 8 (Final): Wrap up warmly, set isComplete = true, summarize that the dossier was forwarded to the doctor.

4. RED-FLAG EMERGENCY RULE:
   - If the patient reports sudden crushing chest pain, radiating arm/jaw pain, stroke signs (slurred speech, facial droop), severe sudden dyspnea, or massive bleeding, set redFlagDetected = true, severity = "CRITICAL", and direct them immediately to Room 101 (Emergency Triage).

5. VOICE & OUTPUT GUIDELINES:
   - 'assistantMessage': Fluent, comforting spoken ${language.label} in standard script (1-2 clear, natural sentences). NO markdown, NO asterisks, NO bullet points, NO emojis.
   - 'translationEn': Accurate English translation of the assistant message.
   - 'quickReplies': Array of 3 to 4 natural, helpful patient responses written in ${language.label}.
   - 'stageProgressPercent': ${(turnCount + 1) * 12 > 100 ? 100 : (turnCount + 1) * 12}.
   - 'isComplete': ${isFinalTurn}.

OUTPUT FORMAT:
Return strictly valid JSON:
{
  "assistantMessage": "Spoken text in ${language.label}",
  "translationEn": "English translation",
  "quickReplies": ["Option 1 in ${language.label}", "Option 2 in ${language.label}", "Option 3 in ${language.label}", "Option 4 in ${language.label}"],
  "stage": "${currentTurnInfo.stage}",
  "stageProgressPercent": number,
  "redFlagDetected": boolean,
  "redFlagDetails": {
    "severity": "CRITICAL" | "URGENT" | "NONE",
    "alertCode": "ACS_CHEST_PAIN" | "STROKE_SIGNS" | "ACUTE_RESPIRATORY" | "NONE",
    "reason": "Rationale or empty",
    "immediateAction": "Immediate instructions or empty"
  },
  "extractedData": {
    "chiefComplaint": "string or null",
    "subtypeOrJoints": "string or null",
    "duration": "string or null",
    "socrates": {
      "site": "string or null",
      "onset": "string or null",
      "character": "string or null",
      "severity": "string or null"
    }
  },
  "isComplete": boolean
}
`;

    const userPrompt = `
${patientContext}

PREVIOUS QUESTIONS ALREADY ASKED IN THIS SESSION (DO NOT REPEAT):
${previousQuestionsAsked.length > 0 ? previousQuestionsAsked.map((q, idx) => `${idx + 1}. "${q}"`).join("\n") : "(None - this is the first turn)"}

CONVERSATION TRANSCRIPT:
${conversationHistoryText || "(Session starting)"}

LATEST PATIENT ANSWER:
"${lastPatientMessage}"

INSTRUCTION FOR THIS TURN:
Acknowledge the latest patient answer, DO NOT repeat any previous question, and ask the next clinical question focusing specifically on: "${currentTurnInfo.topic}".
`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const rawText = response.text || "{}";
        const cleanedText = cleanJsonString(rawText);
        const parsed = JSON.parse(cleanedText);
        if (parsed && parsed.assistantMessage) {
          console.log(`Gemini (Turn ${turnCount + 1}) generated:`, parsed.assistantMessage);
          return res.json(parsed);
        }
      } catch (geminiErr) {
        console.error(
          "Gemini API call failed with model gemini-3.7-flash, trying gemini-2.5-flash fallback:",
          geminiErr?.message || geminiErr
        );
        try {
          const ai = getGeminiClient();
          const response2 = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            config: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          });
          const rawText2 = response2.text || "{}";
          const cleanedText2 = cleanJsonString(rawText2);
          const parsed2 = JSON.parse(cleanedText2);
          if (parsed2 && parsed2.assistantMessage) {
            console.log(`Gemini 2.5 (Turn ${turnCount + 1}) generated:`, parsed2.assistantMessage);
            return res.json(parsed2);
          }
        } catch (geminiErr2) {
          console.error("Gemini 2.5 API also failed:", geminiErr2?.message || geminiErr2);
        }
      }
    }

    const fallbackResponse = generateSmartFallbackDialogue(
      messages,
      patient,
      language,
      currentStage,
      extractedData
    );
    return res.json(fallbackResponse);
  } catch (error) {
    console.error("Error in /api/intake/dialogue:", error);
    const fallbackResponse = generateSmartFallbackDialogue(
      [],
      null,
      { code: "en", label: "English" },
      "CHIEF_COMPLAINT",
      {}
    );
    return res.json(fallbackResponse);
  }
};

const handleSummarize = async (req, res) => {
  try {
    const { patient, dialogueHistory = [], extractedData = {}, redFlagDetails = null } = req.body;

    const patientContext = patient
      ? `
Patient Profile:
Name: ${patient.name || "Patient"} (${patient.age || "?"} yrs, ${patient.gender || "Unspecified"})
ABHA ID: ${patient.abhaId || "N/A"}
Known Conditions: ${patient.knownRecords?.chronicConditions?.join(", ") || "None on file"}
Known Allergies: ${patient.knownRecords?.allergies?.join(", ") || "None (NKDA)"}
Known Medications: ${patient.knownRecords?.currentMedications?.join(", ") || "None on file"}
Known Past Surgeries: ${patient.knownRecords?.pastSurgeries?.join(", ") || "None"}
`
      : `Patient Profile: New unregistered patient`;

    const conversationTranscript = dialogueHistory
      .map(
        (m) =>
          `${m.role.toUpperCase()}: ${m.content} ${m.translationEn ? `(English: ${m.translationEn})` : ""}`
      )
      .join("\n");

    const summaryPrompt = `
You are a senior clinical informatician at an accredited hospital.
Analyze the pre-consultation patient intake interview transcript and generate a structured, pristine clinical history dossier formatted specifically for the examining physician before they start the consult.

${patientContext}

Red Flag Status: ${JSON.stringify(redFlagDetails)}
Extracted Data: ${JSON.stringify(extractedData)}

Interview Transcript:
${conversationTranscript}

Generate a comprehensive clinical summary in JSON adhering strictly to this schema:
{
  "intakeId": "INTK-${Date.now()}",
  "timestamp": "${new Date().toISOString()}",
  "patientSummary": {
    "name": "${patient?.name || "Patient"}",
    "age": ${patient?.age || 0},
    "gender": "${patient?.gender || "Unspecified"}",
    "abhaId": "${patient?.abhaId || "N/A"}"
  },
  "triageAssessment": {
    "triageLevel": "LEVEL_1_RESUSCITATION | LEVEL_2_EMERGENT | LEVEL_3_URGENT | LEVEL_4_LESS_URGENT | LEVEL_5_NON_URGENT",
    "triageColor": "red | orange | yellow | green | blue",
    "urgencyBadge": "CRITICAL EMERGENCY | HIGH PRIORITY | PRIORITY REVIEW | ROUTINE APPOINTMENT",
    "recommendedDepartment": "string (e.g. Cardiology, Pulmonology, Orthopedics, General Internal Medicine, Gastroenterology, Dermatology, Neurology)",
    "priorityQueueRank": "IMMEDIATE (0 min wait) | NEXT IN LINE (< 10 min) | STANDARD QUEUE",
    "redFlagAlert": boolean,
    "redFlagNotes": "string or null"
  },
  "clinicalHistory": {
    "chiefComplaint": "string (Concise standard clinical phrasing with onset/duration)",
    "historyOfPresentIllness": {
      "narrative": "Cohesive medical narrative in third-person clinical prose (e.g. 'Patient presents with a 3-day history of...')",
      "socratesBreakdown": {
        "site": "string (exact anatomical location)",
        "onset": "string (acute / subacute / insidious, precise duration)",
        "character": "string (quality of sensation: burning, squeezing, throbbing, etc.)",
        "radiation": "string (referred or radiating pain pathways)",
        "associations": ["string (e.g. diaphoresis, dyspnea, nausea, fever)"],
        "timeCourse": "string (constant, episodic, waxing/waning)",
        "exacerbatingRelieving": "string (aggravating and alleviating factors)",
        "severity": "string (numeric rating 1-10 and functional limitation)"
      }
    },
    "pastMedicalSurgicalHistory": {
      "existingRecordsReconfirmed": ["string"],
      "newDisclosures": ["string"],
      "surgicalHistory": ["string"]
    },
    "medicationHistory": {
      "currentRegimen": ["string"],
      "adherenceStatus": "Good / Regular | Irregular | Self-discontinued | Not Applicable",
      "newOverTheCounterMeds": ["string"]
    },
    "allergies": {
      "knownDrugAllergies": ["string"],
      "newReportedAllergies": ["string"],
      "severeReactionFlag": boolean
    },
    "familyHistory": "string",
    "personalSocialHistory": {
      "tobaccoSmoking": "string",
      "alcoholIntake": "string",
      "dietSleepNotes": "string"
    },
    "reviewOfSystems": {
      "constitutional": "string",
      "cardiovascular": "string",
      "respiratory": "string",
      "gastrointestinal": "string",
      "neurological": "string",
      "musculoskeletal": "string"
    }
  },
  "physicianQuickActions": [
    "Recommended initial pre-consult vital checks (e.g. 12-lead ECG, SpO2, Blood Glucose, BP in both arms)",
    "Suggested targeted physical exam maneuvers",
    "Initial differential diagnoses considerations (top 3)"
  ]
}
`;

    if (process.env.GEMINI_API_KEY) {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [{ role: "user", parts: [{ text: summaryPrompt }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text || "{}";
      try {
        const parsed = JSON.parse(responseText.trim());
        return res.json(parsed);
      } catch (parseErr) {
        console.error("JSON parse error from Gemini summary:", parseErr, responseText);
      }
    }

    const fallbackSummary = generateSmartFallbackSummary(patient, dialogueHistory, extractedData, redFlagDetails);
    res.json(fallbackSummary);
  } catch (error) {
    console.error("Error in /api/intake/summarize:", error);
    res.status(500).json({ error: error.message || "Failed to generate structured summary" });
  }
};

module.exports = {
  handleDialogue,
  handleSummarize
};
