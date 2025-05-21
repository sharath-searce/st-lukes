// --- Mock Medicine List ---
const mockMedicineList = [
    { name: "Aspirin", commonDosages: ["81mg", "100mg", "325mg"] },
    { name: "Paracetamol", commonDosages: ["500mg", "650mg", "1000mg"] },
    { name: "Amoxicillin", commonDosages: ["250mg", "500mg", "875mg"] },
    { name: "Metformin", commonDosages: ["500mg", "850mg", "1000mg"] },
    { name: "Lisinopril", commonDosages: ["5mg", "10mg", "20mg"] },
    { name: "Atorvastatin", commonDosages: ["10mg", "20mg", "40mg", "80mg"] },
    { name: "Ibuprofen", commonDosages: ["200mg", "400mg", "600mg", "800mg"] },
    { name: "Omeprazole", commonDosages: ["20mg", "40mg"] },
    { name: "Simvastatin", commonDosages: ["10mg", "20mg", "40mg"] },
    { name: "Levothyroxine", commonDosages: ["25mcg", "50mcg", "100mcg"] },
    // Add your full list here
  ];
  
  // --- Configuration for Keywords ---
  const keywordConfig = {
    fever: {
      styleClass: "highlight-unrecognized", // Yellow
      tasks: [
        "Check patient temperature regularly.",
        "Administer antipyretics if ordered.",
      ],
    },
    pain: {
      styleClass: "highlight-unrecognized", // Yellow
      tasks: [
        "Assess pain level (scale 1-10).",
        "Administer pain medication as prescribed.",
        "Consider non-pharmacological pain relief methods.",
      ],
    },
    cough: {
      styleClass: "highlight-unrecognized", // Yellow
      tasks: [
        "Assess respiratory status.",
        "Encourage fluid intake.",
        "Administer cough suppressants/expectorants if ordered.",
      ],
    },
    "shortness of breath": {
      styleClass: "highlight-unrecognized", // Yellow
      tasks: [
        "Assess SpO2 levels.",
        "Administer oxygen if prescribed.",
        "Position patient for optimal breathing (e.g., Fowler's).",
        "Notify physician immediately if worsening.",
      ],
    },
    "administer medication": {
      styleClass: "highlight-unrecognized", // Yellow
      tasks: [
        "Verify medication order (5 Rights).",
        "Prepare and administer medication.",
        "Document administration.",
      ],
    },
    "check vital signs": {
      styleClass: "highlight-unrecognized", // Yellow
      tasks: [
        "Measure BP, HR, RR, Temp, SpO2.",
        "Record vital signs.",
        "Report any abnormal findings.",
      ],
    },
    "wound care": {
      styleClass: "highlight-unrecognized", // Yellow
      tasks: [
        "Assess wound condition.",
        "Perform dressing change using sterile technique.",
        "Document wound assessment and care provided.",
      ],
    },
    // Add any other keywords and their tasks
  };
  
  // --- Combined Regex ---
  const keywords = Object.keys(keywordConfig);
  const combinedRegex = new RegExp(
    `\\b(${keywords.join("|").replace(/ /g, "\\s")})\\b` +
      `|` +
      `([A-Z][a-z]+(?:\\s*(?:\\d{1,4}\\s?(?:mg|ml|mcg|units?))?)?)`,
    "gi"
  );
  
  // --- In configs.js or near highlightStyles definition ---
  
  const highlightStyles = {
    // ... other styles ...
    ".highlight-line": {
      padding: "0.2em 0",
      margin: "-0.2em 0",
      backgroundColor: "rgba(255, 255, 0, 0.15)",
      borderRadius: "4px",
    },
    ".highlight-sentence-yellow": {
      backgroundColor: "rgba(255, 255, 0, 0.3)",
      boxDecorationBreak: "clone",
      WebkitBoxDecorationBreak: "clone",
    },
    // ... other sentence styles ...
  };
  
  // Ensure GlobalStyles includes these
  // In DoctorNurseInterface: <GlobalStyles styles={highlightStyles} />
  
  // --- Fuse Options ---
  const fuseOptions = {
    includeScore: true,
    keys: ["name"],
    threshold: 0.4,
  };
  
  export {
    highlightStyles,
    combinedRegex,
    keywordConfig,
    mockMedicineList,
    fuseOptions,
  };
  