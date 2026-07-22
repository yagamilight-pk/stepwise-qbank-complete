import type { MedicalArticle } from "./types";

export const medicalArticles: MedicalArticle[] = [
  {
    id: "lib-hfpef",
    title: "Pressure-overload hypertrophy and HFpEF",
    step: "Both",
    system: "Cardiovascular",
    category: "Pathophysiology",
    summary: "Connect chronic pressure overload, concentric hypertrophy, impaired relaxation, and the bedside pattern of heart failure with preserved ejection fraction.",
    readingMinutes: 8,
    difficulty: "Medium",
    updatedAt: "2026-07-18",
    keywords: ["hypertension", "concentric hypertrophy", "diastolic dysfunction", "compliance", "sarcomeres", "HFpEF"],
    tags: ["cardiology", "pathology", "hemodynamics"],
    relatedQuestionIds: ["SW-1001", "SW-2005"],
    sections: [
      { id: "core", title: "Core concept", body: "Chronic pressure overload raises systolic wall stress. Cardiomyocytes adapt by adding sarcomeres in parallel, increasing cell width and producing concentric left ventricular hypertrophy. The thicker ventricle can preserve ejection fraction while becoming less compliant.", callout: "Preserved ejection fraction does not mean normal filling. A stiff ventricle can eject a normal fraction of a reduced end-diastolic volume." },
      { id: "mechanism", title: "Mechanism", body: "Reduced ventricular compliance shifts the diastolic pressure-volume relationship upward. A small increase in end-diastolic volume produces a larger rise in filling pressure, which is transmitted to the left atrium and pulmonary circulation.", bullets: ["Pressure overload → sarcomeres added in parallel", "Concentric hypertrophy → impaired relaxation", "Higher filling pressure → exertional dyspnea and pulmonary congestion"] },
      { id: "compare", title: "Concentric vs eccentric remodeling", body: "The geometry points toward the loading condition.", table: { headers: ["Feature", "Concentric hypertrophy", "Eccentric hypertrophy"], rows: [["Primary load", "Pressure", "Volume"], ["Sarcomere pattern", "Parallel", "Series"], ["Cell change", "Increased width", "Increased length"], ["Typical chamber", "Thick wall, smaller cavity", "Dilated cavity"], ["Common examples", "Hypertension, aortic stenosis", "Regurgitant lesions, dilated cardiomyopathy"]] } },
      { id: "exam", title: "Exam strategy", body: "When a vignette gives long-standing hypertension, preserved ejection fraction, exertional dyspnea, and left ventricular hypertrophy, answer the structural change that explains reduced compliance rather than choosing a change associated with dilation." }
    ]
  },
  {
    id: "lib-acid-base",
    title: "A practical acid-base framework",
    step: "Both",
    system: "Renal",
    category: "Clinical reasoning",
    summary: "A repeatable sequence for identifying the primary disorder, checking compensation, calculating the anion gap, and detecting mixed processes.",
    readingMinutes: 10,
    difficulty: "Medium",
    updatedAt: "2026-07-16",
    keywords: ["anion gap", "Winter formula", "metabolic acidosis", "respiratory compensation", "delta gap"],
    tags: ["renal", "pulmonary", "critical care"],
    relatedQuestionIds: ["SW-1004", "SW-2007"],
    sections: [
      { id: "sequence", title: "Five-step sequence", body: "Use the same order every time so that a dramatic pH does not distract you from a mixed disorder.", bullets: ["1. Decide whether the blood is acidemic or alkalemic.", "2. Identify whether PaCO₂ or bicarbonate moves in the direction that explains the pH.", "3. Check expected compensation.", "4. Calculate the anion gap when metabolic acidosis is present.", "5. Compare the change in anion gap with the change in bicarbonate."] },
      { id: "compensation", title: "Expected compensation", body: "Compensation narrows the pH disturbance but does not overcorrect it. A measured value outside the expected range indicates a second primary process.", table: { headers: ["Primary process", "Expected response"], rows: [["Metabolic acidosis", "Expected PaCO₂ ≈ 1.5 × HCO₃⁻ + 8 ± 2"], ["Metabolic alkalosis", "PaCO₂ rises about 0.6–0.75 mm Hg per 1 mEq/L rise in HCO₃⁻"], ["Acute respiratory acidosis", "HCO₃⁻ rises about 1 mEq/L per 10 mm Hg rise in PaCO₂"], ["Chronic respiratory acidosis", "HCO₃⁻ rises about 3.5–4 mEq/L per 10 mm Hg rise in PaCO₂"]] } },
      { id: "gap", title: "Anion gap and delta check", body: "Anion gap = Na⁺ − (Cl⁻ + HCO₃⁻). A disproportionately small fall in bicarbonate suggests an additional metabolic alkalosis; a disproportionately large fall suggests an additional non-anion-gap metabolic acidosis.", callout: "Use the laboratory reference range supplied in the question rather than assuming a single universal normal value." },
      { id: "pitfalls", title: "Common traps", body: "Do not label a disorder from pH alone. A near-normal pH can hide two opposing primary disorders, and a severely abnormal pH can still be a single appropriately compensated process." }
    ]
  },
  {
    id: "lib-shock",
    title: "Hemodynamic patterns in shock",
    step: "Step 2 CK",
    system: "Cardiovascular",
    category: "Emergency medicine",
    summary: "Differentiate hypovolemic, cardiogenic, obstructive, and distributive shock using preload, cardiac output, vascular resistance, and the physical examination.",
    readingMinutes: 9,
    difficulty: "Medium",
    updatedAt: "2026-07-20",
    keywords: ["shock", "SVR", "cardiac output", "preload", "septic", "cardiogenic", "obstructive"],
    tags: ["critical care", "cardiology", "emergency"],
    relatedQuestionIds: ["SW-2001", "SW-2009"],
    sections: [
      { id: "map", title: "Hemodynamic map", body: "Start by asking whether the circulation is empty, the pump is failing, flow is obstructed, or vascular tone is lost.", table: { headers: ["Type", "Preload", "Cardiac output", "SVR", "Typical clue"], rows: [["Hypovolemic", "Low", "Low", "High", "Flat neck veins, fluid loss"], ["Cardiogenic", "High", "Low", "High", "Congestion, cool extremities"], ["Obstructive", "Often high", "Low", "High", "JVD with a mechanical obstruction"], ["Early distributive", "Low/normal", "High", "Low", "Warm extremities, wide pulse pressure"]] } },
      { id: "rv", title: "Right ventricular infarction", body: "An inferior myocardial infarction with hypotension, elevated jugular venous pressure, and clear lungs suggests right ventricular involvement. The right ventricle is preload dependent, so an initial cautious crystalloid bolus may improve output while definitive reperfusion is arranged.", callout: "Avoid reflexively reducing preload when the lungs are clear and right ventricular infarction is suspected." },
      { id: "actions", title: "Immediate priorities", body: "Stabilization follows physiology: restore intravascular volume when depleted, support perfusion pressure in vasodilatory shock, relieve obstruction, and treat the failing pump while avoiding interventions that worsen its loading conditions." }
    ]
  },
  {
    id: "lib-nephritic",
    title: "Nephritic syndromes by timing and complement",
    step: "Both",
    system: "Renal",
    category: "Pathology",
    summary: "Use age, trigger, complement level, biopsy pattern, and timing to separate the major nephritic processes.",
    readingMinutes: 11,
    difficulty: "Hard",
    updatedAt: "2026-07-14",
    keywords: ["nephritic", "hematuria", "RBC casts", "complement", "IgA nephropathy", "poststreptococcal"],
    tags: ["renal", "immunology", "pathology"],
    relatedQuestionIds: ["SW-1004"],
    sections: [
      { id: "pattern", title: "Recognize the syndrome", body: "Glomerular inflammation causes hematuria, dysmorphic red cells or red-cell casts, variable proteinuria, reduced filtration, hypertension, and edema." },
      { id: "timing", title: "Timing is high yield", body: "Synpharyngitic hematuria points toward IgA nephropathy; hematuria after a latent period following skin or throat infection points toward postinfectious glomerulonephritis.", table: { headers: ["Process", "Timing", "Complement", "Key pattern"], rows: [["IgA nephropathy", "Within days of mucosal infection", "Usually normal", "Mesangial IgA"], ["Postinfectious GN", "1–3 weeks after infection", "Often low", "Granular deposits; subepithelial humps"], ["Lupus nephritis", "Variable", "Often low", "Full-house immunofluorescence"], ["ANCA-associated GN", "Systemic vasculitic symptoms", "Usually normal", "Pauci-immune"]] } },
      { id: "strategy", title: "Question strategy", body: "Build the answer from the syndrome first, then use timing and complement. Do not let a single nonspecific symptom such as edema override the urine sediment." }
    ]
  },
  {
    id: "lib-bronchiolitis",
    title: "Bronchiolitis: supportive care and escalation",
    step: "Step 2 CK",
    system: "Pulmonary",
    category: "Pediatrics",
    summary: "Recognize uncomplicated bronchiolitis, avoid low-value routine therapies, and identify infants who need respiratory support or admission.",
    readingMinutes: 7,
    difficulty: "Easy",
    updatedAt: "2026-07-21",
    keywords: ["bronchiolitis", "RSV", "wheezing infant", "nasal suction", "hydration"],
    tags: ["pediatrics", "pulmonary", "infectious disease"],
    relatedQuestionIds: ["SW-2002"],
    sections: [
      { id: "recognize", title: "Typical presentation", body: "A young infant develops rhinorrhea followed by cough, tachypnea, wheeze or crackles, feeding difficulty, and increased work of breathing. The diagnosis is usually clinical." },
      { id: "management", title: "Management", body: "Stable infants receive supportive care: nasal suction, hydration support, and oxygen when hypoxemia is present. Routine antibiotics, systemic glucocorticoids, scheduled bronchodilators, and antivirals do not improve uncomplicated disease.", bullets: ["Assess hydration and feeding", "Observe work of breathing and apnea risk", "Escalate oxygen or respiratory support when needed"] },
      { id: "admit", title: "Reasons to escalate", body: "Admission becomes more likely with hypoxemia, apnea, dehydration, inability to feed, severe work of breathing, high-risk comorbidity, or unreliable follow-up." }
    ]
  },
  {
    id: "lib-postpartum-hemorrhage",
    title: "Postpartum hemorrhage: cause-directed treatment",
    step: "Step 2 CK",
    system: "Obstetrics",
    category: "Obstetrics",
    summary: "Move from immediate resuscitation to the four major causes of postpartum hemorrhage and choose uterotonics around contraindications.",
    readingMinutes: 9,
    difficulty: "Medium",
    updatedAt: "2026-07-12",
    keywords: ["postpartum hemorrhage", "uterine atony", "uterotonics", "retained placenta", "laceration"],
    tags: ["obstetrics", "emergency", "pharmacology"],
    relatedQuestionIds: ["SW-2003"],
    sections: [
      { id: "four-ts", title: "The four causes", body: "Organize the differential as Tone, Trauma, Tissue, and Thrombin. Uterine atony is most common, but a firm uterus should redirect attention toward trauma or retained tissue." },
      { id: "sequence", title: "Immediate sequence", body: "Call for help, quantify blood loss, obtain large-bore access, begin resuscitation, massage an atonic uterus, administer an appropriate uterotonic, and evaluate for retained tissue or genital tract injury." },
      { id: "meds", title: "Uterotonic constraints", body: "Medication choice depends on comorbidity.", table: { headers: ["Agent", "Avoid or use caution"], rows: [["Methylergonovine", "Hypertension or preeclampsia"], ["Carboprost", "Asthma"], ["Misoprostol", "Fewer absolute contraindications; adverse effects include fever and diarrhea"], ["Oxytocin", "Typical first-line uterotonic"]] } },
      { id: "pitfall", title: "Exam pitfall", body: "Do not keep escalating uterotonics when the uterus is already firm and bleeding suggests a laceration." }
    ]
  },
  {
    id: "lib-movement",
    title: "Parkinson disease pharmacology",
    step: "Both",
    system: "Neurology",
    category: "Pharmacology",
    summary: "Connect dopaminergic pathways with levodopa, peripheral decarboxylase inhibition, COMT inhibition, MAO-B inhibition, and common adverse effects.",
    readingMinutes: 10,
    difficulty: "Medium",
    updatedAt: "2026-07-15",
    keywords: ["Parkinson", "levodopa", "carbidopa", "entacapone", "tolcapone", "MAO-B"],
    tags: ["neurology", "pharmacology"],
    relatedQuestionIds: ["SW-1002"],
    sections: [
      { id: "core", title: "Core pharmacology", body: "Levodopa crosses the blood-brain barrier and is converted to dopamine in the central nervous system. Carbidopa inhibits peripheral aromatic L-amino acid decarboxylase, increasing central delivery and reducing peripheral nausea and hypotension." },
      { id: "adjuncts", title: "Adjuncts for wearing off", body: "COMT inhibitors extend levodopa effect. Entacapone acts peripherally; tolcapone acts centrally and peripherally but carries a clinically important hepatotoxicity risk.", table: { headers: ["Class", "Example", "High-yield distinction"], rows: [["COMT inhibitor", "Entacapone", "Peripheral action; orange discoloration may occur"], ["COMT inhibitor", "Tolcapone", "Central and peripheral action; hepatotoxicity"], ["MAO-B inhibitor", "Selegiline or rasagiline", "Reduces dopamine breakdown"], ["Dopamine agonist", "Pramipexole or ropinirole", "Impulse-control disorders and somnolence"]] } },
      { id: "complications", title: "Treatment complications", body: "Long-term levodopa can produce motor fluctuations and dyskinesias. Dopaminergic excess can also cause hallucinations, orthostatic symptoms, and behavioral effects." }
    ]
  },
  {
    id: "lib-thyroid",
    title: "Thyroid test patterns without memorization",
    step: "Both",
    system: "Endocrine",
    category: "Endocrinology",
    summary: "Use feedback physiology to classify primary, central, and subclinical thyroid disorders and recognize common testing traps.",
    readingMinutes: 8,
    difficulty: "Easy",
    updatedAt: "2026-07-19",
    keywords: ["TSH", "free T4", "primary hypothyroidism", "central hypothyroidism", "subclinical"],
    tags: ["endocrine", "physiology"],
    relatedQuestionIds: ["SW-1006", "SW-2006"],
    sections: [
      { id: "feedback", title: "Start with feedback", body: "In primary thyroid disease, the pituitary response moves opposite the free thyroid hormone level. In central disease, TSH may be low, normal, or mildly elevated but is inappropriate for the free T4." },
      { id: "patterns", title: "Pattern table", body: "Read TSH and free T4 together.", table: { headers: ["TSH", "Free T4", "Interpretation"], rows: [["High", "Low", "Primary hypothyroidism"], ["Low", "High", "Primary hyperthyroidism"], ["High", "Normal", "Subclinical hypothyroidism"], ["Low", "Normal", "Subclinical hyperthyroidism or nonthyroidal context"], ["Low/normal", "Low", "Central hypothyroidism or severe illness"]] } },
      { id: "traps", title: "Common traps", body: "Biotin can interfere with some immunoassays. Pregnancy and estrogen alter total hormone concentrations through binding proteins, so free hormone measures and pregnancy-specific ranges matter." }
    ]
  },
  {
    id: "lib-ethics",
    title: "Capacity, consent, and surrogate decisions",
    step: "Step 2 CK",
    system: "Ethics",
    category: "Professionalism",
    summary: "A structured approach to decision-making capacity, informed refusal, emergency treatment, and substituted judgment.",
    readingMinutes: 8,
    difficulty: "Medium",
    updatedAt: "2026-07-13",
    keywords: ["capacity", "consent", "surrogate", "emergency", "informed refusal", "ethics"],
    tags: ["ethics", "communication", "patient safety"],
    relatedQuestionIds: ["SW-2008"],
    sections: [
      { id: "capacity", title: "Decision-making capacity", body: "Capacity is decision specific and can fluctuate. The patient should communicate a choice, understand relevant information, appreciate how it applies personally, and reason about options." },
      { id: "sequence", title: "When capacity is absent", body: "Look first for a valid advance directive or appointed health-care agent. Otherwise use an appropriate surrogate who applies substituted judgment; when preferences are unknown, use the patient’s best interests." },
      { id: "emergency", title: "Emergency exception", body: "When immediate treatment is necessary to prevent serious harm and no surrogate is available, clinicians may provide stabilizing care under implied consent. Continue efforts to identify preferences and a surrogate." },
      { id: "pitfalls", title: "Exam pitfalls", body: "Disagreement with the medical team does not prove incapacity. A psychiatric diagnosis, cognitive impairment, intoxication, or communication barrier should trigger assessment and support rather than an automatic conclusion." }
    ]
  },
  {
    id: "lib-antibiotics",
    title: "Antibiotic selection by site and host",
    step: "Step 2 CK",
    system: "Infectious Disease",
    category: "Pharmacology",
    summary: "Choose empiric therapy by likely organism, site penetration, severity, host risk, and local resistance—then narrow when data arrive.",
    readingMinutes: 9,
    difficulty: "Hard",
    updatedAt: "2026-07-17",
    keywords: ["empiric antibiotics", "source control", "de-escalation", "penetration", "cultures"],
    tags: ["infectious disease", "pharmacology", "stewardship"],
    relatedQuestionIds: ["SW-2004"],
    sections: [
      { id: "framework", title: "Selection framework", body: "A defensible empiric regimen covers the most likely organisms for the anatomic site while accounting for severity, recent exposures, immune status, organ function, allergies, and resistance risk." },
      { id: "sequence", title: "Clinical sequence", body: "Obtain cultures when they will change management and when doing so does not dangerously delay therapy. Start appropriate empiric treatment in severe infection, achieve source control, reassess daily, and narrow or stop therapy based on microbiology and clinical response." },
      { id: "pitfall", title: "High-yield pitfall", body: "A broad drug is not automatically a better drug. Inadequate source control, poor penetration, or failure to adjust for the host can matter more than adding additional coverage." }
    ]
  },
  {
    id: "lib-stats",
    title: "Biostatistics: from 2×2 table to clinical meaning",
    step: "Both",
    system: "Biostatistics",
    category: "Epidemiology",
    summary: "Calculate and interpret sensitivity, specificity, predictive values, likelihood ratios, risk reduction, and number needed to treat.",
    readingMinutes: 12,
    difficulty: "Hard",
    updatedAt: "2026-07-11",
    keywords: ["sensitivity", "specificity", "PPV", "NPV", "likelihood ratio", "NNT"],
    tags: ["biostatistics", "epidemiology"],
    relatedQuestionIds: ["SW-1007", "SW-2007"],
    sections: [
      { id: "table", title: "Build the 2×2 table", body: "Put disease status in columns and test result in rows, then label true positive, false positive, false negative, and true negative before calculating anything." },
      { id: "measures", title: "Core measures", body: "Sensitivity and specificity are properties of the test in a defined setting; predictive values change with prevalence.", table: { headers: ["Measure", "Formula", "Interpretation"], rows: [["Sensitivity", "TP / (TP + FN)", "Probability of a positive test when disease is present"], ["Specificity", "TN / (TN + FP)", "Probability of a negative test when disease is absent"], ["Positive predictive value", "TP / (TP + FP)", "Probability of disease after a positive result"], ["Negative predictive value", "TN / (TN + FN)", "Probability of no disease after a negative result"]] } },
      { id: "treatment", title: "Treatment effects", body: "Absolute risk reduction equals control risk minus treatment risk. Number needed to treat is the reciprocal of absolute risk reduction expressed as a proportion.", callout: "A large relative risk reduction can coexist with a small absolute benefit when baseline risk is low." }
    ]
  },
  {
    id: "lib-psych",
    title: "Mood disorders: diagnosis, safety, and treatment logic",
    step: "Step 2 CK",
    system: "Psychiatry",
    category: "Psychiatry",
    summary: "Separate major depression, bipolar disorders, grief, and substance-induced symptoms while prioritizing safety.",
    readingMinutes: 10,
    difficulty: "Medium",
    updatedAt: "2026-07-10",
    keywords: ["major depression", "mania", "bipolar", "suicide risk", "antidepressant"],
    tags: ["psychiatry", "patient safety"],
    relatedQuestionIds: ["SW-2009"],
    sections: [
      { id: "safety", title: "Safety first", body: "Assess suicidal intent, plan, means, prior attempts, psychosis, severe agitation, intoxication, supports, and ability to engage in a safety plan. Imminent risk can require emergency evaluation and a higher level of care." },
      { id: "bipolar", title: "Screen for mania", body: "Before treating a depressive episode, ask about periods of elevated or irritable mood with decreased need for sleep, increased activity, pressured speech, grandiosity, or risky behavior. Antidepressant monotherapy can destabilize bipolar illness." },
      { id: "distinctions", title: "Diagnostic distinctions", body: "Normal grief can include intense sadness but usually preserves self-esteem and occurs in waves linked to reminders. Persistent pervasive worthlessness, anhedonia, neurovegetative change, and suicidal thinking support a major depressive episode." }
    ]
  }
];

export const librarySystems = [...new Set(medicalArticles.map(article => article.system))].sort();
