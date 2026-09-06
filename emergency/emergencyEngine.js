// emergency/emergencyEngine.js

const STATES = {
  IDLE: "IDLE",
  CHECKING_CONSCIOUSNESS: "CHECKING_CONSCIOUSNESS",
  BREATHING_DIFFICULTY: "BREATHING_DIFFICULTY",
  CHEST_PAIN: "CHEST_PAIN",
  STROKE_WARNING: "STROKE_WARNING",
  SEVERE_BLEEDING: "SEVERE_BLEEDING",
  SEIZURE: "SEIZURE",
  SEVERE_ALLERGY: "SEVERE_ALLERGY",
  FAINTING: "FAINTING",
  SEVERE_BURN: "SEVERE_BURN",
  VOMITING: "VOMITING",
  SEVERE_ABDOMINAL_PAIN: "SEVERE_ABDOMINAL_PAIN",
  CRITICAL_UNCONSCIOUS: "CRITICAL_UNCONSCIOUS",
  CRITICAL: "CRITICAL",
  GENERAL: "GENERAL",
};


// ==================================================
// NORMALIZE TEXT
// ==================================================

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// ==================================================
// HELPER
// ==================================================

function hasAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}


// ==================================================
// CONSCIOUSNESS
// ==================================================

function detectUnconscious(text) {
  return hasAny(text, [
    "unconscious",
    "not conscious",
    "lost consciousness",
    "passed out",
    "not responding",
    "does not respond",
    "doesn't respond",
    "not responsive",
    "unresponsive",
    "collapsed and not responding",
  ]);
}


function detectConscious(text) {
  return hasAny(text, [
    "he is conscious",
    "she is conscious",
    "they are conscious",

    "he was conscious",
    "she was conscious",
    "they were conscious",

    "he's conscious",
    "she's conscious",

    "is conscious",
    "was conscious",

    "conscious now",

    "he is awake",
    "she is awake",
    "they are awake",

    "he's awake",
    "she's awake",

    "awake now",

    "responding now",
    "he is responding",
    "she is responding",
    "they are responding",

    // speech recognition sometimes changes the sentence
    "face conscious",
  ]);
}


// ==================================================
// BREATHING
// ==================================================

function detectBreathingDifficulty(text) {

  const phrases = [
    "difficulty breathing",
    "difficulty in breathing",
    "difficult breathing",

    "difficult in breathing",

    "trouble breathing",
    "trouble in breathing",

    "problem breathing",
    "problem in breathing",
    "breathing problem",
    "breathing problems",

    "shortness of breath",
    "short of breath",
    "breathlessness",
    "breathless",

    "struggling to breathe",
    "struggling with breathing",

    "hard to breathe",
    "hard time breathing",

    "can't breathe",
    "cannot breathe",

    "unable to breathe",
    "not able to breathe",
  ];

  if (hasAny(text, phrases)) {
    return true;
  }

  const difficultyWord =
    /\b(difficulty|difficult|trouble|problem|problems|struggling|hard)\b/;

  const breathingWord =
    /\b(breathing|breathe|breath)\b/;

  return (
    difficultyWord.test(text) &&
    breathingWord.test(text)
  );
}


// IMPORTANT:
// Speech recognition can hear "worst" instead of "worse".

function detectBreathingWorse(text) {

  return hasAny(text, [

    "breathing is worse",
    "breathing got worse",
    "breathing getting worse",
    "breathing became worse",

    "breathing is worst",
    "breathing got worst",
    "breathing getting worst",
    "breathing became worst",

    "it is getting worse",
    "it is getting worst",

    "getting worse",
    "getting worst",

    "got worse",
    "got worst",

    "became worse",
    "became worst",

    "more difficult to breathe",
    "more difficult breathing",

    "harder to breathe",

    "can't breathe now",
    "cannot breathe now",

    "breathing stopped",
    "stopped breathing",

    "not breathing",
  ]);
}


function detectBreathingStable(text) {

  return hasAny(text, [
    "breathing is okay",
    "breathing is fine",
    "breathing is normal",
    "breathing normally",

    "breathing better",
    "breathing has improved",
    "breathing improved",

    "he can breathe",
    "she can breathe",
    "they can breathe",
  ]);
}


// ==================================================
// OTHER EMERGENCY INTENTS
// ==================================================

function detectChestPain(text) {
  return hasAny(text, [
    "chest pain",
    "pain in chest",
    "chest hurts",
    "chest is hurting",
    "pressure in chest",
    "tightness in chest",
    "chest pressure",
  ]);
}


function detectStrokeWarning(text) {
  return hasAny(text, [
    "face drooping",
    "face is drooping",
    "facial drooping",

    "one side of face",

    "arm weakness",
    "leg weakness",
    "one arm is weak",
    "one side is weak",

    "slurred speech",
    "speech is slurred",

    "difficulty speaking",
    "can't speak",
    "cannot speak",

    "sudden weakness",
    "sudden numbness",
    "sudden confusion",
  ]);
}


function detectSevereBleeding(text) {
  return hasAny(text, [
    "severe bleeding",
    "heavy bleeding",
    "bleeding heavily",
    "bleeding a lot",
    "won't stop bleeding",
    "cannot stop bleeding",
    "can't stop bleeding",
    "blood loss",
  ]);
}


function detectSeizure(text) {
  return hasAny(text, [
    "seizure",
    "having a seizure",
    "convulsion",
    "convulsions",
    "convulsing",
    "shaking uncontrollably",
    "shaking badly",
  ]);
}


function detectSevereAllergy(text) {
  return hasAny(text, [
    "severe allergic reaction",
    "allergic reaction",
    "anaphylaxis",
    "throat swelling",
    "swollen throat",
    "face swelling",
    "tongue swelling",
    "lips swelling",
    "difficulty swallowing",
  ]);
}


function detectFainting(text) {
  return hasAny(text, [
    "fainted",
    "fainting",
    "passed out",
    "nearly fainted",
    "almost fainted",
    "felt faint",
    "feeling faint",
  ]);
}


function detectBurn(text) {
  return hasAny(text, [
    "severe burn",
    "bad burn",
    "serious burn",
    "burn injury",
    "burned badly",
  ]);
}


function detectVomiting(text) {
  return hasAny(text, [
    "vomiting",
    "vomited",
    "throwing up",
    "threw up",
    "keeps vomiting",
    "started vomiting",
  ]);
}


function detectSevereAbdominalPain(text) {
  return hasAny(text, [
    "severe abdominal pain",
    "severe stomach pain",
    "bad stomach pain",
    "severe belly pain",
    "abdominal pain",
    "stomach pain",
    "belly pain",
  ]);
}


// ==================================================
// DETECT ALL INTENTS
// ==================================================

function detectIntents(text) {

  return {
    unconscious: detectUnconscious(text),

    conscious: detectConscious(text),

    breathingDifficulty: detectBreathingDifficulty(text),

    breathingWorse: detectBreathingWorse(text),

    breathingStable: detectBreathingStable(text),

    chestPain: detectChestPain(text),

    strokeWarning: detectStrokeWarning(text),

    severeBleeding: detectSevereBleeding(text),

    seizure: detectSeizure(text),

    severeAllergy: detectSevereAllergy(text),

    fainting: detectFainting(text),

    burn: detectBurn(text),

    vomiting: detectVomiting(text),

    severeAbdominalPain:
      detectSevereAbdominalPain(text),
  };
}


// ==================================================
// RESULT
// ==================================================

function result(
  state,
  priority,
  response,
  intents = {}
) {
  return {
    state,
    priority,
    response,
    intents,
  };
}


// ==================================================
// MAIN ENGINE
// ==================================================

function analyzeEmergency(
  message,
  currentState = STATES.IDLE
) {

  const text = normalizeText(message);

  if (!text) {
    return result(
      currentState,
      "normal",
      "Please tell me what is happening."
    );
  }

  const intents = detectIntents(text);

  console.log("\n-----------------------------");
  console.log("USER:", message);
  console.log("CURRENT STATE:", currentState);
  console.log("INTENTS:", intents);
  console.log("-----------------------------");


  // ==================================================
  // 1. UNCONSCIOUS ALWAYS HAS HIGHEST PRIORITY
  // ==================================================

  if (intents.unconscious) {

    return result(
      STATES.CRITICAL_UNCONSCIOUS,

      "critical",

      "This is critical information. Call your local emergency service immediately and stay with him. Follow instructions from the emergency dispatcher or a trained professional.",

      intents
    );
  }


  // ==================================================
  // 2. PERSON BECOMES CONSCIOUS AGAIN
  // ==================================================

  if (
    currentState === STATES.CRITICAL_UNCONSCIOUS &&
    intents.conscious
  ) {

    // If vomiting is also mentioned,
    // acknowledge the NEW information.

    if (intents.vomiting) {

      return result(
        STATES.CRITICAL,

        "critical",

        "It is important that he is conscious again, but vomiting after an episode of unresponsiveness is still concerning. Call your local emergency service and tell the dispatcher what happened. Follow their instructions.",

        intents
      );
    }


    return result(
      STATES.CRITICAL,

      "critical",

      "It is important that he is conscious again, but because he was previously unresponsive, this still needs urgent medical attention. Call your local emergency service and tell the dispatcher that he was briefly unconscious. Follow their instructions.",

      intents
    );
  }


  // ==================================================
  // 3. BREATHING GETTING WORSE
  // ==================================================

  if (intents.breathingWorse) {

    return result(
      STATES.CRITICAL,

      "critical",

      "If his breathing is getting worse, call your local emergency service immediately and follow the emergency dispatcher's instructions. Stay with him and monitor his condition.",

      intents
    );
  }


  // ==================================================
  // 4. SEVERE ALLERGY
  // ==================================================

  if (intents.severeAllergy) {

    return result(
      STATES.SEVERE_ALLERGY,

      "critical",

      "A severe allergic reaction can become an emergency quickly. Call your local emergency service immediately and follow the dispatcher's instructions.",

      intents
    );
  }


  // ==================================================
  // 5. STROKE WARNING
  // ==================================================

  if (intents.strokeWarning) {

    return result(
      STATES.STROKE_WARNING,

      "critical",

      "These symptoms may indicate a serious emergency. Call your local emergency service immediately and tell the dispatcher when the symptoms started.",

      intents
    );
  }


  // ==================================================
  // 6. SEVERE BLEEDING
  // ==================================================

  if (intents.severeBleeding) {

    return result(
      STATES.SEVERE_BLEEDING,

      "critical",

      "Heavy bleeding is an emergency. Call your local emergency service immediately and follow the dispatcher's instructions.",

      intents
    );
  }


  // ==================================================
  // 7. SEIZURE
  // ==================================================

  if (intents.seizure) {

    return result(
      STATES.SEIZURE,

      "critical",

      "A seizure may require emergency help. Call your local emergency service if it is prolonged, repeated, or the person is not recovering. Follow the emergency dispatcher's instructions.",

      intents
    );
  }


  // ==================================================
  // 8. CHEST PAIN
  // ==================================================

  if (intents.chestPain) {

    return result(
      STATES.CHEST_PAIN,

      "high",

      "Chest pain can be an emergency. Call your local emergency service, especially if the pain is severe, sudden, or associated with other serious symptoms. Follow the dispatcher's instructions.",

      intents
    );
  }


  // ==================================================
  // 9. CHECKING CONSCIOUSNESS
  // ==================================================

  if (
    currentState ===
    STATES.CHECKING_CONSCIOUSNESS
  ) {

    // Example:
    // "he was conscious but has difficulty breathing"

    if (
      intents.conscious &&
      intents.breathingDifficulty
    ) {

      return result(
        STATES.BREATHING_DIFFICULTY,

        "high",

        "Thank you. Since he is conscious but having difficulty breathing, is his breathing getting worse or staying about the same?",

        intents
      );
    }


    if (intents.conscious) {

      return result(
        STATES.BREATHING_DIFFICULTY,

        "high",

        "Okay. Since he is conscious, is his breathing getting worse or staying about the same?",

        intents
      );
    }


    if (
      text === "yes" ||
      text === "yeah" ||
      text === "yep"
    ) {

      return result(
        STATES.BREATHING_DIFFICULTY,

        "high",

        "Okay. Since he is conscious, is his breathing getting worse or staying about the same?",

        intents
      );
    }


    return result(
      STATES.CHECKING_CONSCIOUSNESS,

      "high",

      "I need to know whether he is conscious and responding. Please tell me yes or no.",

      intents
    );
  }


  // ==================================================
  // 10. BREATHING DIFFICULTY
  // ==================================================

  if (
    currentState ===
      STATES.BREATHING_DIFFICULTY ||
    intents.breathingDifficulty
  ) {

    if (intents.breathingWorse) {

      return result(
        STATES.CRITICAL,

        "critical",

        "If his breathing is getting worse, call your local emergency service immediately and follow the emergency dispatcher's instructions. Stay with him and monitor his condition.",

        intents
      );
    }


    if (intents.breathingStable) {

      return result(
        STATES.BREATHING_DIFFICULTY,

        "high",

        "Keep watching his breathing closely. If it becomes worse or he becomes unresponsive, call your local emergency service immediately.",

        intents
      );
    }


    // New vomiting information

    if (intents.vomiting) {

      return result(
        STATES.VOMITING,

        "high",

        "Vomiting together with breathing difficulty needs close attention. Keep monitoring him and contact your local emergency service if his condition worsens.",

        intents
      );
    }


    // Conscious information

    if (intents.conscious) {

      return result(
        STATES.BREATHING_DIFFICULTY,

        "high",

        "Okay. He is conscious. Tell me whether his breathing is getting worse or staying about the same.",

        intents
      );
    }


    return result(
      STATES.BREATHING_DIFFICULTY,

      "high",

      "Tell me whether his breathing is getting worse or staying about the same.",

      intents
    );
  }


  // ==================================================
  // 11. FAINTING
  // ==================================================

  if (intents.fainting) {

    return result(
      STATES.FAINTING,

      "high",

      "Fainting can have serious causes. If he is not fully recovering, has chest pain, breathing difficulty, or becomes unresponsive, call your local emergency service immediately.",

      intents
    );
  }


  // ==================================================
  // 12. BURN
  // ==================================================

  if (intents.burn) {

    return result(
      STATES.SEVERE_BURN,

      "high",

      "A severe burn may require urgent medical attention. Contact your local emergency service for serious burns and follow their instructions.",

      intents
    );
  }


  // ==================================================
  // 13. VOMITING
  // ==================================================

  if (intents.vomiting) {

    return result(
      STATES.VOMITING,

      "moderate",

      "Keep monitoring the person. If vomiting is severe or associated with unconsciousness, breathing difficulty, severe pain, or another serious symptom, contact your local emergency service.",

      intents
    );
  }


  // ==================================================
  // 14. ABDOMINAL PAIN
  // ==================================================

  if (intents.severeAbdominalPain) {

    return result(
      STATES.SEVERE_ABDOMINAL_PAIN,

      "high",

      "Severe abdominal pain may require urgent medical attention. Contact your local emergency service if the pain is severe, sudden, or accompanied by other serious symptoms.",

      intents
    );
  }


  // ==================================================
  // 15. FIRST BREATHING MESSAGE
  // ==================================================

  if (intents.breathingDifficulty) {

    return result(
      STATES.CHECKING_CONSCIOUSNESS,

      "high",

      "Stay with him. Is he conscious and responding?",

      intents
    );
  }


  // ==================================================
  // 16. GENERAL CONSCIOUSNESS
  // ==================================================

  if (intents.conscious) {

    return result(
      STATES.GENERAL,

      "normal",

      "Okay. Tell me what other symptoms or changes you are noticing.",

      intents
    );
  }


  // ==================================================
  // DEFAULT
  // ==================================================

  return result(
    STATES.GENERAL,

    "normal",

    "Tell me what is happening right now, including any major changes in the person's condition.",

    intents
  );
}


// ==================================================
// EXPORT
// ==================================================

module.exports = {
  STATES,
  analyzeEmergency,
  detectIntents,
};