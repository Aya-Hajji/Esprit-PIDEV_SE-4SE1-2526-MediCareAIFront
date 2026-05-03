"""
Generate raw medical dataset (2000 rows) simulating web scraping.
Includes: HTML tags, null values, duplicates, special chars, noise.
Run: python scripts/generate_raw_dataset.py
Output: raw_medical_news.csv
"""

import csv
import random
import copy

# ── Seed for reproducibility ──────────────────────────────────────────────────
random.seed(42)

# ── Raw titles (messy, as scraped) ────────────────────────────────────────────
TITLES = [
    "Covid cases increase !!!",
    "<b>New diabetes treatment</b>",
    "Sleep problems in students $$$",
    "Heart disease risk factors ##",
    "   ",
    "Cancer research breakthrough!!!",
    "Mental health crisis in teens",
    "NULL",
    "Obesity rates rising worldwide",
    "New vaccine approved by FDA!!!",
    "Alzheimer's disease: new hope???",
    "High blood pressure treatment",
    "<h2>Flu season 2024 warning</h2>",
    "Depression & anxiety in adults",
    "Diabetes type 2 prevention tips",
    "COVID-19 long term effects ###",
    "Children's mental health issues",
    "New antibiotic resistant bacteria",
    "Stroke prevention strategies",
    "Kidney disease management tips",
    "Asthma treatment advances 2024",
    "Breast cancer screening guidelines",
    "Prostate cancer new treatment!!!",
    "Arthritis pain management",
    "Migraine headache causes & cures",
    "Nutrition tips for heart health",
    "Exercise benefits for seniors",
    "Insomnia treatment options",
    "Thyroid disease symptoms",
    "Liver disease prevention",
    "Lung cancer early detection",
    "Parkinson's disease research",
    "Multiple sclerosis treatment",
    "Epilepsy management strategies",
    "Chronic pain management",
    "Immune system boost tips",
    "Gut health and probiotics",
    "Vitamin D deficiency symptoms",
    "Iron deficiency anemia treatment",
    "Skin cancer prevention tips",
    "Eye health and vision care",
    "Dental health tips for adults",
    "Bone health and osteoporosis",
    "Hormonal imbalance symptoms",
    "ADHD in children treatment",
    "Autism spectrum disorder research",
    "Eating disorders treatment",
    "Addiction recovery strategies",
    "Stress management techniques",
    "Mindfulness and meditation benefits",
    None,
    "!!!BREAKING: New virus detected!!!",
    "<div>Cholesterol management tips</div>",
    "Blood sugar control strategies ###",
    "Weight loss tips that actually work",
    "Healthy aging strategies for seniors",
    "Pregnancy complications prevention",
    "Infertility treatment options 2024",
    "Menopause symptoms management",
    "Endometriosis treatment advances",
    "Polycystic ovary syndrome PCOS",
    "Celiac disease gluten free diet",
    "Crohn's disease management",
    "Irritable bowel syndrome IBS",
    "Acid reflux GERD treatment",
    "Gallbladder disease symptoms",
    "Pancreatitis causes and treatment",
    "Hepatitis B and C treatment",
    "HIV AIDS latest research 2024",
    "Tuberculosis prevention strategies",
    "Malaria treatment advances",
    "Dengue fever prevention tips",
    "Zika virus latest updates",
    "Ebola outbreak response",
    "Monkeypox symptoms treatment",
    "RSV respiratory virus in children",
    "Pneumonia treatment guidelines",
    "Sepsis early detection strategies",
    "Blood clot prevention tips",
    "Aneurysm risk factors treatment",
    "Atrial fibrillation management",
    "Heart failure treatment options",
    "Coronary artery disease prevention",
    "Peripheral artery disease symptoms",
    "Deep vein thrombosis prevention",
    "Pulmonary embolism treatment",
    "Chronic obstructive pulmonary COPD",
    "Interstitial lung disease treatment",
    "Sarcoidosis symptoms management",
    "Lupus autoimmune disease treatment",
    "Rheumatoid arthritis management",
    "Psoriasis treatment advances 2024",
    "Eczema skin condition management",
    "Rosacea treatment options",
    "Acne treatment for adults",
    "Hair loss causes and treatment",
    "Nail fungus treatment options",
    "Urinary tract infection prevention",
    "Kidney stones prevention tips",
    "Bladder cancer early detection",
    "Testicular cancer symptoms",
    "Ovarian cancer screening",
]

# ── Raw content (messy HTML, noise, nulls) ────────────────────────────────────
CONTENTS = [
    "<div>New covid wave detected in Europe. Cases rising fast!!!</div>",
    "<p>Scientists discover new treatment for diabetes type 2. <br/>Results promising.</p>",
    "$$$ Students suffer from sleep deprivation ### bad text here",
    "<h1>Heart disease remains leading cause of death worldwide</h1>",
    "",
    "NULL",
    "   \n\t   ",
    "<div class='article'><p>Cancer research shows breakthrough in immunotherapy treatment.</p></div>",
    "Mental health crisis affecting teenagers globally. Depression rates up 30%.",
    "!!! CLICK HERE !!! Obesity epidemic continues to grow in developed countries !!!",
    "<span style='color:red'>Alzheimer's disease affects 50 million people worldwide</span>",
    "High blood pressure hypertension affects 1 in 3 adults. New treatment options available.",
    "<div><h2>Flu season 2024</h2><p>Health officials warn of severe flu season ahead.</p></div>",
    "Depression & anxiety disorders affect 264 million people worldwide according to WHO.",
    "Type 2 diabetes can be prevented with lifestyle changes diet exercise weight loss.",
    "COVID-19 long term effects include fatigue brain fog shortness of breath ### noise",
    "<article>Children mental health issues rising post pandemic. Parents concerned.</article>",
    "New antibiotic resistant bacteria strain discovered in hospital settings worldwide.",
    "Stroke prevention: control blood pressure cholesterol diabetes exercise regularly.",
    "Kidney disease management requires regular monitoring diet changes medication.",
    "<p>Asthma treatment advances include new biologics for severe asthma patients.</p>",
    "Breast cancer screening guidelines updated. Annual mammograms recommended from age 40.",
    "Prostate cancer new treatment shows 90% success rate in clinical trials!!!",
    "Arthritis pain management includes physical therapy medication lifestyle changes.",
    "Migraine headaches affect 1 billion people worldwide. New treatments available.",
    None,
    "Exercise benefits for seniors include improved balance strength cognitive function.",
    "<div>Insomnia affects 30% of adults. Cognitive behavioral therapy most effective.</div>",
    "Thyroid disease symptoms include fatigue weight changes mood swings hair loss.",
    "Liver disease prevention: avoid alcohol maintain healthy weight get vaccinated.",
    "$$$ BUY NOW $$$ Lung cancer early detection saves lives. CT scan recommended.",
    "Parkinson's disease research shows promising results with new gene therapy approach.",
    "Multiple sclerosis treatment advances include new disease modifying therapies.",
    "Epilepsy management: medication surgery diet therapy vagus nerve stimulation.",
    "Chronic pain management requires multidisciplinary approach medication therapy.",
    "<p>Immune system boost: sleep well eat healthy exercise manage stress.</p>",
    "Gut health probiotics prebiotics fiber diet microbiome mental health connection.",
    "Vitamin D deficiency linked to depression immune dysfunction bone loss.",
    "Iron deficiency anemia most common nutritional deficiency worldwide affects women.",
    "Skin cancer prevention: sunscreen protective clothing avoid tanning beds.",
    None,
    "Dental health tips: brush twice daily floss regularly visit dentist every 6 months.",
    "Bone health osteoporosis prevention: calcium vitamin D weight bearing exercise.",
    "Hormonal imbalance symptoms: fatigue weight gain mood changes irregular periods.",
    "ADHD in children treatment includes medication behavioral therapy parent training.",
    "<div>Autism spectrum disorder research advances in early detection intervention.</div>",
    "Eating disorders anorexia bulimia binge eating require professional treatment.",
    "Addiction recovery: medication assisted treatment therapy support groups.",
    "Stress management: exercise meditation yoga deep breathing time management.",
    "Mindfulness meditation reduces stress anxiety depression improves wellbeing.",
    "### SPAM ### Buy cheap medications online no prescription needed ### SPAM ###",
    "<div class='ad'>ADVERTISEMENT: Best weight loss pill ever!!!</div>",
    "Cholesterol management: diet exercise medication statins lifestyle changes.",
    "Blood sugar control: diet exercise medication monitoring regular checkups.",
    "Weight loss tips: calorie deficit exercise sleep stress management hydration.",
    "Healthy aging: exercise nutrition social connection mental stimulation sleep.",
    "Pregnancy complications: preeclampsia gestational diabetes preterm birth.",
    "Infertility treatment: IVF IUI medication surgery lifestyle changes.",
    "Menopause symptoms: hot flashes night sweats mood changes bone loss.",
    "Endometriosis treatment: pain management surgery hormone therapy.",
    "PCOS polycystic ovary syndrome: hormonal disorder affecting reproductive health.",
    "Celiac disease: autoimmune condition triggered by gluten strict diet required.",
    "Crohn's disease: inflammatory bowel disease medication surgery lifestyle.",
    "IBS irritable bowel syndrome: diet stress management medication therapy.",
    "Acid reflux GERD: lifestyle changes medication surgery in severe cases.",
    "Gallbladder disease: gallstones cholecystitis treatment surgery diet.",
    "Pancreatitis: inflammation of pancreas causes treatment complications.",
    "Hepatitis B C treatment: antiviral medications cure possible for hepatitis C.",
    "HIV AIDS research: new treatments improve life expectancy quality of life.",
    "Tuberculosis prevention: BCG vaccine treatment antibiotics public health.",
    "Malaria treatment: artemisinin combination therapy prevention mosquito nets.",
    "Dengue fever prevention: mosquito control no specific treatment supportive care.",
    "Zika virus: mosquito borne birth defects prevention travel advisory.",
    "Ebola outbreak: hemorrhagic fever high mortality rate vaccine available.",
    "Monkeypox: viral disease symptoms treatment prevention vaccination.",
    "RSV respiratory syncytial virus: common in children treatment supportive.",
    "Pneumonia treatment: antibiotics antivirals supportive care hospitalization.",
    "Sepsis: life threatening infection early detection treatment critical.",
    "Blood clot prevention: movement hydration compression stockings medication.",
    "Aneurysm: bulge in blood vessel risk factors treatment surgery.",
    "Atrial fibrillation: irregular heartbeat treatment medication cardioversion.",
    "Heart failure: chronic condition treatment medication lifestyle changes.",
    "Coronary artery disease: prevention diet exercise medication surgery.",
    "Peripheral artery disease: reduced blood flow legs treatment exercise.",
    "Deep vein thrombosis: blood clot in leg prevention treatment anticoagulants.",
    "Pulmonary embolism: blood clot in lung emergency treatment anticoagulants.",
    "COPD: chronic lung disease smoking cessation medication pulmonary rehab.",
    "Interstitial lung disease: scarring of lungs treatment medication oxygen.",
    "Sarcoidosis: inflammatory disease affects lungs lymph nodes treatment.",
    "Lupus: autoimmune disease affects multiple organs treatment medication.",
    "Rheumatoid arthritis: autoimmune joint disease treatment biologics DMARDs.",
    "Psoriasis: skin condition treatment topical medications biologics phototherapy.",
    "Eczema: atopic dermatitis treatment moisturizers topical steroids biologics.",
    "Rosacea: facial redness treatment topical medications laser therapy.",
    "Acne treatment: topical retinoids antibiotics hormonal therapy isotretinoin.",
    "Hair loss: androgenetic alopecia treatment minoxidil finasteride transplant.",
    "Nail fungus: onychomycosis treatment antifungal medication laser therapy.",
    "UTI prevention: hydration hygiene cranberry probiotics antibiotics.",
    "Kidney stones: prevention hydration diet medication lithotripsy surgery.",
    "Bladder cancer: early detection treatment surgery chemotherapy immunotherapy.",
    "Testicular cancer: most common cancer young men treatment surgery chemo.",
    "Ovarian cancer: silent killer screening treatment surgery chemotherapy.",
]

# ── Sources ───────────────────────────────────────────────────────────────────
SOURCES = [
    "healthnews.com", "medscape.com", "webmd.com", "mayoclinic.org",
    "nih.gov", "who.int", "cdc.gov", "healthline.com",
    "medicalnewstoday.com", "reuters.com/health", "bbc.com/health",
    "nytimes.com/health", "theguardian.com/health", "forbes.com/health",
    None, "UNKNOWN", "N/A", "http://spam-site.com", "blog.random.net",
    "reddit.com/r/health", "twitter.com", "facebook.com/health",
]

CATEGORIES = [
    "cardiology", "oncology", "neurology", "endocrinology", "infectious_disease",
    "mental_health", "nutrition", "pediatrics", "geriatrics", "dermatology",
    "pulmonology", "gastroenterology", "nephrology", "rheumatology", "gynecology",
    None, "UNKNOWN", "misc", "general", "research",
]

SENTIMENTS = ["positive", "negative", "neutral", None, "UNKNOWN", "mixed"]

LANGUAGES = ["en", "en", "en", "en", "fr", "es", "de", None, "UNKNOWN"]

# ── Generate 2000 rows ────────────────────────────────────────────────────────
rows = []

for i in range(2000):
    title   = random.choice(TITLES)
    content = random.choice(CONTENTS)
    source  = random.choice(SOURCES)
    cat     = random.choice(CATEGORIES)
    sent    = random.choice(SENTIMENTS)
    lang    = random.choice(LANGUAGES)

    # Inject noise patterns
    noise_type = random.randint(0, 10)

    if noise_type == 0:
        title = None
    elif noise_type == 1:
        content = None
    elif noise_type == 2:
        title = "   "
    elif noise_type == 3:
        content = "NULL"
    elif noise_type == 4 and title:
        title = title + " !!! ### $$$"
    elif noise_type == 5 and content:
        content = f"<div><p>{content}</p></div>"
    elif noise_type == 6:
        title = "DUPLICATE TEST TITLE"
        content = "DUPLICATE TEST CONTENT for testing deduplication pipeline."
    elif noise_type == 7 and content:
        content = content + "\n\n### ADVERTISEMENT ### Buy now!!! Click here!!!"
    elif noise_type == 8:
        source = None
    elif noise_type == 9 and title:
        title = title.upper()

    # Random like/view counts (some negative or zero = dirty data)
    likes = random.randint(-5, 500)
    views = random.randint(0, 10000) if random.random() > 0.05 else None
    replies = random.randint(0, 200) if random.random() > 0.1 else -1

    # Random date (some malformed)
    year  = random.choice([2022, 2023, 2024, 2025])
    month = random.randint(1, 12)
    day   = random.randint(1, 28)
    if random.random() < 0.05:
        date_str = "INVALID_DATE"
    elif random.random() < 0.05:
        date_str = None
    else:
        date_str = f"{year}-{month:02d}-{day:02d}"

    rows.append({
        "id":         i + 1,
        "title":      title,
        "content":    content,
        "source":     source,
        "category":   cat,
        "sentiment":  sent,
        "language":   lang,
        "likes":      likes,
        "views":      views,
        "replies":    replies,
        "date":       date_str,
        "url":        f"https://{source}/{i}" if source and source.startswith("http") is False and source not in [None, "UNKNOWN", "N/A"] else source,
    })

# Add 50 exact duplicates (rows 1-50 repeated)
for i in range(50):
    dup = copy.deepcopy(rows[i])
    dup["id"] = 2001 + i
    rows.append(dup)

# ── Write CSV ─────────────────────────────────────────────────────────────────
fieldnames = ["id", "title", "content", "source", "category", "sentiment",
              "language", "likes", "views", "replies", "date", "url"]

with open("raw_medical_news.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"✅ Dataset generated: {len(rows)} rows → raw_medical_news.csv")
print(f"   - Null titles:    {sum(1 for r in rows if not r['title'] or str(r['title']).strip() in ['', 'NULL', 'None'])}")
print(f"   - Null contents:  {sum(1 for r in rows if not r['content'] or str(r['content']).strip() in ['', 'NULL', 'None'])}")
print(f"   - Duplicates:     50 exact duplicates injected")
print(f"   - HTML content:   ~{sum(1 for r in rows if r['content'] and '<' in str(r['content']))} rows")
print(f"   - Negative likes: {sum(1 for r in rows if isinstance(r['likes'], int) and r['likes'] < 0)} rows")
