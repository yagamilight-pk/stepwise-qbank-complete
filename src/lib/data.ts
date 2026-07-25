import type { AdminUser, AppState, Flashcard, InfluencerProfile, MarketingAsset, Note, PayoutRecord, Question, ReferralConversion } from "./types";

const q = (
  id: string,
  step: Question["step"],
  system: string,
  discipline: string,
  topic: string,
  difficulty: Question["difficulty"],
  stem: string,
  choices: string[],
  correctIndex: number,
  explanation: string,
  objective: string,
  pearls: string[],
  wrong: string[],
  tags: string[],
  globalAccuracy: number,
  averageTimeSec: number
): Question => ({
  id,
  step,
  system,
  discipline,
  topic,
  difficulty,
  status: "Published",
  stem,
  choices: choices.map((text, index) => ({ id: `${id}-${String.fromCharCode(65 + index)}`, text })),
  correctChoiceId: `${id}-${String.fromCharCode(65 + correctIndex)}`,
  explanation,
  objective,
  pearls,
  wrongChoiceNotes: Object.fromEntries(wrong.map((note, index) => [`${id}-${String.fromCharCode(65 + index)}`, note])),
  tags,
  author: id.charCodeAt(id.length - 1) % 2 ? "Dr. Maya Patel" : "Dr. Aaron Kim",
  updatedAt: "2026-07-18",
  globalAccuracy,
  averageTimeSec,
  sourceLabel: "Stepwise original"
});

export const demoQuestions: Question[] = [
  q(
    "SW-1001", "Step 1", "Cardiovascular", "Pathology", "Hemodynamics", "Medium",
    "A 67-year-old man with long-standing hypertension develops progressive exertional dyspnea. Echocardiography shows concentric left ventricular hypertrophy with a preserved ejection fraction. Which change most directly accounts for the reduced ventricular compliance?",
    ["Increased cardiomyocyte length in series", "Increased cardiomyocyte width in parallel", "Decreased interstitial collagen deposition", "Eccentric chamber dilation", "Reduced afterload"],
    1,
    "Chronic pressure overload causes sarcomeres to be added in parallel, increasing cardiomyocyte width and producing concentric hypertrophy. The thick, fibrotic ventricle relaxes poorly, which raises filling pressures despite a preserved ejection fraction.",
    "Recognize the structural adaptation to chronic pressure overload and connect it to diastolic dysfunction.",
    ["Pressure overload → sarcomeres in parallel → concentric hypertrophy.", "A preserved ejection fraction does not imply normal filling pressures."],
    ["Sarcomeres in series are associated with volume overload and eccentric hypertrophy.", "Correct: parallel sarcomere addition thickens the wall.", "Interstitial collagen generally increases, not decreases.", "Eccentric dilation is typical of chronic volume overload.", "Hypertension increases rather than reduces afterload."],
    ["hypertension", "heart failure", "hypertrophy"], 64, 91
  ),
  q(
    "SW-1002", "Step 1", "Neurology", "Pharmacology", "Movement disorders", "Hard",
    "A patient with Parkinson disease develops disabling end-of-dose bradykinesia despite optimized levodopa/carbidopa therapy. A medication is added that selectively inhibits peripheral and central breakdown of dopamine by blocking catechol-O-methyltransferase. Which adverse effect is most characteristic of this drug class?",
    ["Pulmonary fibrosis", "Orange discoloration of body fluids", "Severe neutropenia", "Hypertensive crisis after tyramine", "Hemorrhagic cystitis"],
    1,
    "COMT inhibitors such as entacapone and tolcapone extend levodopa action. They can cause diarrhea, dyskinesia, and orange-brown discoloration of urine or other body fluids. Tolcapone additionally carries a risk of hepatotoxicity.",
    "Identify a characteristic adverse effect of COMT inhibitors used as adjuncts in Parkinson disease.",
    ["Entacapone mainly acts peripherally; tolcapone acts peripherally and centrally.", "Tolcapone requires liver monitoring."],
    ["Pulmonary fibrosis is associated with some dopamine agonists such as ergot derivatives.", "Correct: harmless orange-brown discoloration can occur.", "Severe neutropenia is not a typical class effect.", "Tyramine reactions are associated with nonselective MAO inhibition.", "Hemorrhagic cystitis is associated with cyclophosphamide or ifosfamide."],
    ["parkinson", "COMT", "dopamine"], 48, 108
  ),
  q(
    "SW-1003", "Step 1", "Renal", "Physiology", "Acid-base", "Medium",
    "A healthy volunteer hyperventilates for several minutes before an arterial blood sample is obtained. Compared with baseline, which renal response is expected if the disturbance persists?",
    ["Increased proximal bicarbonate reabsorption", "Increased ammonium excretion", "Decreased bicarbonate excretion", "Decreased hydrogen ion secretion", "Increased generation of new bicarbonate"],
    3,
    "Hyperventilation lowers arterial carbon dioxide and causes respiratory alkalosis. With persistence, the kidney compensates by reducing hydrogen ion secretion and bicarbonate reabsorption, thereby increasing urinary bicarbonate loss.",
    "Predict renal compensation for respiratory alkalosis.",
    ["Respiratory alkalosis is compensated by lowering serum bicarbonate.", "Renal compensation takes hours to days."],
    ["This would retain bicarbonate and worsen alkalemia.", "Ammonium excretion falls when acid secretion falls.", "Bicarbonate excretion increases rather than decreases.", "Correct: less distal hydrogen secretion promotes bicarbonaturia.", "New bicarbonate generation is reduced."],
    ["acid base", "respiratory alkalosis", "renal compensation"], 71, 82
  ),
  q(
    "SW-1004", "Step 1", "Immunology", "Microbiology", "Immunodeficiency", "Hard",
    "A 7-month-old boy has recurrent bacterial and enteroviral infections. Examination shows no palpable tonsillar tissue. Laboratory studies reveal very low levels of all immunoglobulin classes and absent circulating mature B cells. A defect in which signaling protein best explains this presentation?",
    ["CD40 ligand", "Bruton tyrosine kinase", "Common gamma chain", "Adenosine deaminase", "NADPH oxidase"],
    1,
    "X-linked agammaglobulinemia is caused by a Bruton tyrosine kinase defect, which arrests B-cell development at the pre-B stage. Symptoms begin after maternally transferred IgG declines, and lymphoid tissue dependent on mature B cells is poorly developed.",
    "Diagnose X-linked agammaglobulinemia from its timing and laboratory pattern.",
    ["Absent mature B cells distinguishes this from many class-switch disorders.", "Enteroviruses are an important risk in profound humoral immunodeficiency."],
    ["CD40L deficiency causes hyper-IgM syndrome with B cells present.", "Correct: BTK is required for B-cell maturation.", "Common gamma-chain defects produce severe combined immunodeficiency.", "ADA deficiency also causes combined T- and B-cell dysfunction.", "NADPH oxidase deficiency causes chronic granulomatous disease."],
    ["BTK", "B cells", "agammaglobulinemia"], 59, 96
  ),
  q(
    "SW-1005", "Step 1", "Gastrointestinal", "Biochemistry", "Vitamins", "Easy",
    "A patient with chronic alcohol use presents with confusion, gait instability, and abnormal eye movements. Before glucose is administered, which cofactor should be given to reduce the risk of worsening neurologic injury?",
    ["Biotin", "Cobalamin", "Folate", "Pyridoxine", "Thiamine"],
    4,
    "The triad of confusion, ataxia, and ophthalmoplegia suggests Wernicke encephalopathy due to thiamine deficiency. Thiamine should be administered before glucose because carbohydrate metabolism can further consume limited thiamine stores and worsen injury.",
    "Recognize Wernicke encephalopathy and the order of emergency treatment.",
    ["Thiamine is a cofactor for pyruvate dehydrogenase, alpha-ketoglutarate dehydrogenase, branched-chain alpha-ketoacid dehydrogenase, and transketolase.", "Treat suspected disease immediately; do not wait for confirmatory testing."],
    ["Biotin deficiency is associated with dermatitis and alopecia.", "Cobalamin deficiency causes macrocytosis and neurologic dysfunction but not this classic triad.", "Folate deficiency does not cause the acute triad.", "Pyridoxine deficiency can cause neuropathy, sideroblastic anemia, and seizures.", "Correct: give thiamine before glucose."],
    ["thiamine", "Wernicke", "alcohol"], 88, 61
  ),
  q(
    "SW-1006", "Step 1", "Reproductive", "Endocrinology", "Sex development", "Hard",
    "A 16-year-old girl is evaluated for primary amenorrhea. She has normal breast development, sparse pubic hair, a blind-ending vagina, and no uterus on pelvic imaging. Serum testosterone is in the typical adult male range. Which diagnosis is most likely?",
    ["5-alpha-reductase deficiency", "Androgen insensitivity syndrome", "Müllerian agenesis", "Turner syndrome", "Congenital adrenal hyperplasia"],
    1,
    "Complete androgen insensitivity occurs in an individual with a 46,XY karyotype and nonfunctional androgen receptors. Testes produce anti-Müllerian hormone, so the uterus is absent. Testosterone is aromatized to estrogen, allowing breast development, while androgen-dependent pubic hair is sparse.",
    "Differentiate causes of primary amenorrhea with absent Müllerian structures.",
    ["Absent uterus plus high testosterone and sparse body hair strongly favors androgen insensitivity.", "Undescended testes carry a malignancy risk and are removed after puberty."],
    ["5-alpha-reductase deficiency often causes virilization at puberty and may have male-pattern body hair.", "Correct: androgen receptor dysfunction explains the full pattern.", "Müllerian agenesis has normal ovaries, normal female-range testosterone, and normal pubic hair.", "Turner syndrome features gonadal dysgenesis and absent breast development without treatment.", "Classic congenital adrenal hyperplasia usually causes virilization in a 46,XX individual with a uterus."],
    ["amenorrhea", "AIS", "DSD"], 67, 112
  ),
  q(
    "SW-2001", "Step 2 CK", "Cardiovascular", "Internal Medicine", "Acute coronary syndrome", "Medium",
    "A 59-year-old man presents 90 minutes after onset of crushing substernal chest pain. ECG shows ST-segment elevations in leads II, III, and aVF. Blood pressure is 82/54 mm Hg, jugular venous pressure is elevated, and the lungs are clear. Which immediate intervention is most appropriate while definitive reperfusion is arranged?",
    ["Intravenous nitroglycerin", "Intravenous normal saline bolus", "Intravenous furosemide", "Noninvasive positive-pressure ventilation", "Urgent pericardiocentesis"],
    1,
    "Inferior STEMI with hypotension, elevated jugular venous pressure, and clear lungs suggests right ventricular infarction. The right ventricle is preload dependent, so cautious intravenous fluid resuscitation can improve output. Nitrates and diuretics may precipitate severe hypotension.",
    "Recognize right ventricular infarction and select initial hemodynamic support.",
    ["Obtain right-sided leads when right ventricular infarction is suspected.", "Avoid preload-reducing agents until hemodynamics stabilize."],
    ["Nitroglycerin reduces preload and can worsen hypotension.", "Correct: a cautious crystalloid bolus supports RV preload.", "Furosemide reduces preload and is inappropriate with clear lungs.", "Positive pressure also reduces venous return.", "The presentation is not most consistent with tamponade."],
    ["STEMI", "right ventricular infarction", "shock"], 74, 89
  ),
  q(
    "SW-2002", "Step 2 CK", "Pulmonary", "Pediatrics", "Bronchiolitis", "Easy",
    "A 5-month-old infant has 3 days of rhinorrhea, cough, poor feeding, and wheezing. Temperature is 37.8°C (100.0°F), respiratory rate is 48/min, and oxygen saturation is 95% on room air. Mild subcostal retractions are present. Which management is most appropriate?",
    ["Oral amoxicillin", "Scheduled inhaled albuterol", "Supportive care with nasal suction and hydration", "Systemic glucocorticoids", "Ribavirin therapy"],
    2,
    "Typical bronchiolitis in a stable infant is managed supportively with hydration, nasal suction, and oxygen only when needed. Routine bronchodilators, glucocorticoids, antibiotics, and antivirals do not improve outcomes in uncomplicated disease.",
    "Choose evidence-based management for uncomplicated infant bronchiolitis.",
    ["Clinical severity and feeding ability guide disposition.", "Apnea risk is greater in very young or premature infants."],
    ["Antibiotics are not indicated for a typical viral syndrome.", "Routine bronchodilator use is not recommended.", "Correct: supportive care is first line.", "Systemic steroids do not routinely improve bronchiolitis.", "Ribavirin is not used routinely."],
    ["bronchiolitis", "RSV", "pediatrics"], 84, 66
  ),
  q(
    "SW-2003", "Step 2 CK", "Obstetrics", "Obstetrics & Gynecology", "Postpartum hemorrhage", "Medium",
    "A 28-year-old woman develops heavy vaginal bleeding immediately after an uncomplicated vaginal delivery. The uterus is enlarged and boggy. Bimanual uterine massage and oxytocin are initiated, but bleeding continues. She has severe asthma. Which medication is the best next treatment?",
    ["Carboprost", "Methylergonovine", "Misoprostol", "Terbutaline", "Magnesium sulfate"],
    2,
    "Uterine atony is the most common cause of postpartum hemorrhage. After massage and oxytocin, additional uterotonics are used. Carboprost can trigger bronchospasm and should be avoided in severe asthma; misoprostol is a suitable alternative. Methylergonovine is avoided in hypertension.",
    "Select an additional uterotonic while accounting for maternal contraindications.",
    ["Think of the four Ts: Tone, Trauma, Tissue, Thrombin.", "Carboprost is contraindicated in asthma; methylergonovine is contraindicated in hypertension."],
    ["Carboprost can cause bronchospasm in asthma.", "Methylergonovine can be used in some patients, but misoprostol is safer here when the stem emphasizes severe asthma and no blood pressure information.", "Correct: misoprostol is an effective uterotonic without bronchospasm risk.", "Terbutaline relaxes the uterus and would worsen atony.", "Magnesium sulfate also reduces uterine tone."],
    ["postpartum hemorrhage", "uterine atony", "uterotonic"], 76, 78
  ),
  q(
    "SW-2004", "Step 2 CK", "Neurology", "Emergency Medicine", "Ischemic stroke", "Hard",
    "A 71-year-old woman develops sudden aphasia and right-sided weakness 2 hours ago. Noncontrast head CT shows no hemorrhage. CT angiography shows a proximal left middle cerebral artery occlusion. She has no contraindication to thrombolysis. Which management is most appropriate?",
    ["Aspirin alone", "Intravenous thrombolysis alone", "Mechanical thrombectomy alone", "Intravenous thrombolysis followed by evaluation for mechanical thrombectomy", "Heparin infusion"],
    3,
    "A patient with a disabling acute ischemic stroke within the intravenous thrombolysis window should receive thrombolysis if eligible. A proximal large-vessel occlusion also warrants urgent endovascular thrombectomy evaluation; thrombolysis should not be withheld while thrombectomy is arranged.",
    "Coordinate reperfusion therapies for an eligible patient with large-vessel ischemic stroke.",
    ["Large-vessel occlusion changes the pathway but does not automatically replace eligible IV thrombolysis.", "Time from last known well and imaging determine candidacy."],
    ["Aspirin is insufficient as the sole acute reperfusion strategy in an eligible patient.", "Thrombolysis alone misses the added benefit of thrombectomy for an accessible large-vessel occlusion.", "Thrombectomy should not delay otherwise indicated IV thrombolysis.", "Correct: pursue both therapies in sequence when eligible.", "Routine heparin does not improve acute ischemic stroke outcomes and increases bleeding risk."],
    ["stroke", "thrombectomy", "thrombolysis"], 62, 105
  ),
  q(
    "SW-2005", "Step 2 CK", "Psychiatry", "Psychiatry", "Mood disorders", "Medium",
    "A 32-year-old woman reports 3 weeks of depressed mood, loss of interest, insomnia, poor concentration, low energy, and guilt. She denies substance use. She also describes a prior 6-day period of markedly decreased need for sleep, increased goal-directed activity, pressured speech, and impulsive spending that did not require hospitalization. Which diagnosis is most likely?",
    ["Major depressive disorder", "Bipolar I disorder", "Bipolar II disorder", "Cyclothymic disorder", "Borderline personality disorder"],
    2,
    "The current episode meets criteria for major depression. The prior episode is consistent with hypomania because it lasted at least 4 days and did not cause marked impairment, psychosis, or hospitalization. Major depression plus hypomania establishes bipolar II disorder.",
    "Differentiate hypomania from mania and diagnose bipolar II disorder.",
    ["Any history of mania establishes bipolar I disorder.", "Antidepressant monotherapy can destabilize bipolar illness."],
    ["A history of hypomania excludes unipolar major depressive disorder.", "Bipolar I requires at least one manic episode.", "Correct: major depression plus hypomania is bipolar II.", "Cyclothymia involves chronic subthreshold symptoms without full major depressive episodes.", "Personality pathology does not best explain a discrete hypomanic syndrome."],
    ["bipolar", "hypomania", "depression"], 69, 93
  ),
  q(
    "SW-2006", "Step 2 CK", "Gastrointestinal", "Surgery", "Small bowel obstruction", "Medium",
    "A 64-year-old man with a history of open colectomy presents with crampy abdominal pain, vomiting, and distention. CT shows dilated loops of small bowel with a transition point and no free air, pneumatosis, or reduced bowel wall enhancement. He is hemodynamically stable and has no peritoneal signs. What is the best initial management?",
    ["Immediate exploratory laparotomy", "Nasogastric decompression and intravenous fluids", "Colonoscopy", "Oral cathartics", "Broad-spectrum antibiotics as sole therapy"],
    1,
    "A stable patient with an uncomplicated adhesive small bowel obstruction should initially receive bowel rest, nasogastric decompression, intravenous fluids, and electrolyte correction. Surgery is indicated for peritonitis, ischemia, perforation, a closed-loop obstruction, or failure of nonoperative management.",
    "Distinguish uncomplicated adhesive obstruction from indications for emergency surgery.",
    ["Prior abdominal surgery is the leading clue for adhesions.", "Serial examinations are essential because strangulation can evolve."],
    ["There are no signs of ischemia, perforation, or peritonitis requiring immediate surgery.", "Correct: start nonoperative decompression and resuscitation.", "Colonoscopy does not treat a small bowel transition point.", "Cathartics can worsen obstruction and aspiration risk.", "Antibiotics alone do not relieve a mechanical obstruction."],
    ["SBO", "adhesions", "surgery"], 79, 81
  ),
  q(
    "SW-2007", "Step 2 CK", "Endocrine", "Internal Medicine", "Diabetic ketoacidosis", "Easy",
    "A 23-year-old man with type 1 diabetes presents with abdominal pain, vomiting, and deep respirations. Glucose is 510 mg/dL, bicarbonate is 10 mEq/L, and serum potassium is 5.4 mEq/L. Which intervention should be started first?",
    ["Intravenous regular insulin", "Intravenous isotonic crystalloid", "Intravenous sodium bicarbonate", "Oral potassium replacement", "Subcutaneous long-acting insulin"],
    1,
    "Initial treatment of diabetic ketoacidosis begins with rapid isotonic fluid resuscitation to restore perfusion. Insulin follows after potassium is assessed; total-body potassium is depleted even when the initial serum concentration is elevated.",
    "Prioritize the initial steps of diabetic ketoacidosis management.",
    ["Fluids first, then insulin with close potassium monitoring.", "Bicarbonate is reserved for extreme acidemia rather than routine DKA."],
    ["Insulin is important but fluid resuscitation is initiated first.", "Correct: isotonic crystalloid restores intravascular volume.", "Routine bicarbonate is not indicated at this bicarbonate level.", "Potassium is not given orally in an actively vomiting, acidotic patient and the current serum level is elevated.", "Long-acting subcutaneous insulin is not the initial resuscitative therapy."],
    ["DKA", "diabetes", "fluids"], 86, 57
  ),
  q(
    "SW-2008", "Step 2 CK", "Ethics", "Professionalism", "Decision making", "Hard",
    "A 78-year-old man with pneumonia is alert, understands the proposed treatment, explains the consequences of refusing it, and consistently declines antibiotics because he wishes to focus on comfort. His daughter insists that treatment be given. What is the most appropriate response?",
    ["Follow the daughter's request because she is next of kin", "Seek an emergency guardianship order", "Respect the patient's refusal after confirming decision-making capacity", "Administer antibiotics covertly", "Request a psychiatric commitment"],
    2,
    "A patient with decision-making capacity may refuse recommended treatment, even when the refusal could result in death. Capacity is decision-specific and requires understanding, appreciation, reasoning, and communication of a stable choice. A surrogate does not override a capacitated patient.",
    "Apply decision-making capacity and informed refusal principles.",
    ["Capacity is a clinical determination; competency is a legal determination.", "Disagreement with the medical team does not by itself indicate incapacity."],
    ["Next of kin acts only when the patient lacks capacity or has authorized them.", "Guardianship is unnecessary when the patient has capacity.", "Correct: honor the informed refusal.", "Covert treatment violates autonomy and consent.", "There is no evidence of a psychiatric condition justifying involuntary commitment."],
    ["ethics", "capacity", "autonomy"], 73, 99
  )
];

export const seedNotes: Note[] = [
  {
    id: "note-1",
    questionId: "SW-1001",
    title: "Pressure vs volume overload",
    body: "Pressure overload adds sarcomeres in parallel (concentric). Volume overload adds them in series (eccentric).",
    tags: ["cardio", "high-yield"],
    createdAt: "2026-07-12T09:20:00.000Z",
    updatedAt: "2026-07-18T11:10:00.000Z"
  },
  {
    id: "note-2",
    questionId: "SW-2003",
    title: "Postpartum hemorrhage contraindications",
    body: "Carboprost: avoid in asthma. Methylergonovine: avoid in hypertension. Think Tone, Trauma, Tissue, Thrombin.",
    tags: ["obgyn", "emergency"],
    createdAt: "2026-07-17T14:05:00.000Z",
    updatedAt: "2026-07-17T14:05:00.000Z"
  }
];

export const seedFlashcards: Flashcard[] = [
  {
    id: "card-1",
    questionId: "SW-1004",
    front: "Which immunodeficiency causes absent mature B cells and very low immunoglobulins after 6 months of age?",
    back: "X-linked agammaglobulinemia due to a Bruton tyrosine kinase defect.",
    tags: ["immunology", "Step 1"],
    interval: 3,
    ease: 2.5,
    repetitions: 2,
    lapses: 0,
    dueAt: "2026-07-22T08:00:00.000Z",
    lastReviewedAt: "2026-07-19T08:00:00.000Z",
    createdAt: "2026-07-14T08:00:00.000Z"
  },
  {
    id: "card-2",
    questionId: "SW-2001",
    front: "Initial hemodynamic support for hypotensive right ventricular infarction with clear lungs?",
    back: "A cautious isotonic fluid bolus; avoid nitrates and diuretics because the RV is preload dependent.",
    tags: ["cardio", "Step 2 CK"],
    interval: 1,
    ease: 2.35,
    repetitions: 1,
    lapses: 1,
    dueAt: "2026-07-22T08:00:00.000Z",
    lastReviewedAt: "2026-07-21T08:00:00.000Z",
    createdAt: "2026-07-19T08:00:00.000Z"
  },
  {
    id: "card-3",
    questionId: "SW-2003",
    front: "Which common postpartum hemorrhage uterotonics have major contraindications?",
    back: "Carboprost—avoid in asthma. Methylergonovine—avoid in hypertension.",
    tags: ["obgyn", "Step 2 CK"],
    interval: 6,
    ease: 2.6,
    repetitions: 3,
    lapses: 0,
    dueAt: "2026-07-27T08:00:00.000Z",
    lastReviewedAt: "2026-07-21T08:00:00.000Z",
    createdAt: "2026-07-10T08:00:00.000Z"
  }
];

export const users: AdminUser[] = [];

export const demoInfluencers: InfluencerProfile[] = [];

export function calcConversion(
  id: string,
  influencerId: string,
  customerMaskedEmail: string,
  planName: string,
  listPrice: number,
  discountPercent: number,
  promoCodeUsed: string,
  status: ReferralConversion["status"],
  timestamp: string,
  influencerCommissionRate: number = 0.30
): ReferralConversion {
  const discountAmount = Math.round(listPrice * (discountPercent / 100) * 100) / 100;
  const customerPaid = Math.round((listPrice - discountAmount) * 100) / 100;
  const operationalCost = Math.round(listPrice * 0.10 * 100) / 100;
  const netProfit = Math.round((listPrice - operationalCost - discountAmount) * 100) / 100;
  const commissionEarned = Math.round(netProfit * influencerCommissionRate * 100) / 100;
  return {
    id,
    influencerId,
    customerMaskedEmail,
    planName,
    listPrice,
    discountPercent,
    discountAmount,
    customerPaid,
    operationalCost,
    netProfit,
    influencerCommissionRate,
    commissionEarned,
    promoCodeUsed,
    status,
    timestamp
  };
}

export const demoConversions: ReferralConversion[] = [];

export const demoPayoutRecords: PayoutRecord[] = [];

export const demoMarketingAssets: MarketingAsset[] = [
  {
    id: "ast_1",
    title: "Instagram Story & Reel Overlays (USMLE Prep)",
    category: "Social Story",
    dimensions: "1080x1920 PX",
    fileSize: "4.2 MB",
    downloadUrl: "#",
    thumbnailUrl: "",
    previewText: "High-yield USMLE questions with Stepwise signature purple gradient overlays."
  },
  {
    id: "ast_2",
    title: "YouTube Video Description Copy & Promo Links",
    category: "Copy Template",
    downloadUrl: "#",
    previewText: "📌 Get 15% OFF Stepwise QBank with your exclusive partner code! Features 4,000+ USMLE questions with 120fps animated explanations."
  },
  {
    id: "ast_3",
    title: "Stepwise Dark Mode & Light Mode Vector Logo Pack",
    category: "Logo Pack",
    dimensions: "SVG / PNG / EPS",
    fileSize: "8.5 MB",
    downloadUrl: "#",
    previewText: "Transparent SVG and high-res PNG logos for video graphics and blog banners."
  },
  {
    id: "ast_4",
    title: "Website Sidebar & Blog Banner (728x90 & 300x250)",
    category: "Banner",
    dimensions: "728x90 & 300x250 PX",
    fileSize: "2.1 MB",
    downloadUrl: "#",
    previewText: "Eye-catching banner set emphasizing Stepwise 120fps GPU animations and adaptive QBank."
  }
];

export const initialState: AppState = {
  questions: demoQuestions,
  attempts: [],
  notes: [],
  flashcards: [],
  bookmarks: [],
  flagged: [],
  sessions: [],
  planSettings: {
    examDate: "2026-10-17",
    weeklyDays: [1, 2, 3, 4, 5, 6],
    weekdayMinutes: 90,
    weekendMinutes: 180,
    targetStep: "Step 2 CK",
    targetScore: 255
  },
  studyTasks: [],
  settings: {
    theme: "light",
    reducedMotion: false,
    sound: true,
    showTimer: true,
    dailyGoal: 40,
    emailDigest: true,
    compactMode: false,
    planReminders: true,
    cardReminders: true,
    communityActivity: false,
    highContrast: false,
    largeText: false
  },
  adminUsers: [],
  reports: [],
  notifications: [],
  savedArticles: [],
  libraryActivity: [],
  influencers: [],
  referralConversions: [],
  payoutRecords: [],
  activeInfluencerId: "",
  currentInfluencerId: null
};
