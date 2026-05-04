import { Specialty } from '../models/specialty.model';

/**
 * Canonical hospital-style specialties for demo / offline fallback.
 * `matchTags` drives doctor–specialty matching when the auth API does not expose structured specialty on users.
 */
export const CLINICAL_SPECIALTY_SEED: Specialty[] = [
  {
    id: 1,
    name: 'General internal medicine',
    description: 'Adult primary care, undifferentiated complaints, chronic disease coordination.',
    matchTags: 'internal medicine,primary care,generalist,hypertension,diabetes follow-up'
  },
  {
    id: 2,
    name: 'Cardiology',
    description: 'Ischemic heart disease, heart failure, arrhythmia, valvular disease, preventive cardiology.',
    matchTags: 'cardiology,cardiologie,cardiac,heart,cœur,coeur,coronary,echo,ecg,hypertension,chest pain'
  },
  {
    id: 3,
    name: 'Pulmonology',
    description: 'Asthma, COPD, ILD, sleep-disordered breathing, pleural disease, bronchoscopy pathway.',
    matchTags: 'pulmonology,pneumologie,lung,respiratory,asthma,copd,spirometry,oxygen'
  },
  {
    id: 4,
    name: 'Gastroenterology & hepatology',
    description: 'IBD, liver disease, functional GI disorders, screening endoscopy coordination.',
    matchTags: 'gastroenterology,gi,hepatology,liver,ibd,endoscopy,colonoscopy'
  },
  {
    id: 5,
    name: 'Nephrology',
    description: 'CKD, dialysis transitions, electrolyte disorders, resistant hypertension workup.',
    matchTags: 'nephrology,kidney,ckd,dialysis,creatinine,proteinuria'
  },
  {
    id: 6,
    name: 'Endocrinology & metabolism',
    description: 'Diabetes technology, thyroid, adrenal, pituitary, osteoporosis, lipid disorders.',
    matchTags: 'endocrinology,diabetes,thyroid,hba1c,insulin,metabolism'
  },
  {
    id: 7,
    name: 'Neurology',
    description: 'Stroke, epilepsy, movement disorders, MS, headache, neuromuscular disease.',
    matchTags: 'neurology,brain,stroke,epilepsy,migraine,neuro'
  },
  {
    id: 8,
    name: 'Rheumatology',
    description: 'Inflammatory arthritis, connective tissue disease, vasculitis, immunotherapy monitoring.',
    matchTags: 'rheumatology,arthritis,lupus,vasculitis,joint inflammation'
  },
  {
    id: 9,
    name: 'Infectious diseases',
    description: 'Complex infection, HIV/HCV, travel medicine, antimicrobial stewardship liaison.',
    matchTags: 'infectious,sepsis,hiv,hepatitis,antibiotic,tropical'
  },
  {
    id: 10,
    name: 'Hematology–oncology',
    description: 'Solid tumors, hematologic malignancies, cytopenias, transfusion medicine interface.',
    matchTags: 'oncology,cancer,chemo,hematology,anemia,malignancy'
  },
  {
    id: 11,
    name: 'Dermatology',
    description: 'Inflammatory skin disease, skin cancer triage, procedural dermatology.',
    matchTags: 'dermatology,skin,psoriasis,eczema,melanoma'
  },
  {
    id: 12,
    name: 'Orthopedic surgery',
    description: 'Fracture care, arthroplasty, sports medicine, spine (surgical) pathways.',
    matchTags: 'orthopedic,orthopaedics,bone,fracture,joint replacement,sports medicine'
  },
  {
    id: 13,
    name: 'Obstetrics & gynecology',
    description: 'Antenatal care, labor triage, benign gynecology, family planning.',
    matchTags: 'obstetrics,gynecology,pregnancy,prenatal,women health,obgyn'
  },
  {
    id: 14,
    name: 'Pediatrics',
    description: 'Neonatal follow-up, growth/development, pediatric chronic disease.',
    matchTags: 'pediatrics,child,infant,adolescent,vaccination'
  },
  {
    id: 15,
    name: 'Emergency medicine',
    description: 'Acute stabilization, triage protocols, trauma reception, short-stay observation.',
    matchTags: 'emergency,er,trauma,triage,resuscitation'
  },
  {
    id: 16,
    name: 'Psychiatry',
    description: 'Mood and anxiety disorders, psychosis, addiction medicine liaison, crisis assessment.',
    matchTags: 'psychiatry,mental health,depression,anxiety,addiction'
  },
  {
    id: 17,
    name: 'Otolaryngology (ENT)',
    description: 'Sinonasal disease, hearing loss, head and neck benign pathology.',
    matchTags: 'ent,otolaryngology,ear,nose,throat,sinus,hearing'
  },
  {
    id: 18,
    name: 'Radiology',
    description: 'Diagnostic imaging interpretation, interventional radiology referral hub.',
    matchTags: 'radiology,imaging,mri,ct,ultrasound,interventional'
  }
];

export const CLINICAL_SPECIALTY_COUNT = CLINICAL_SPECIALTY_SEED.length;
