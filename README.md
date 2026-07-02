# HealthBridge – AI-powered Healthcare Access & Hospital Management Platform

![HealthBridge Homepage](./homepage_screenshot.png)

HealthBridge is a full-stack, production-quality medical portal designed to resolve transparency in healthcare access. It enables patients to check insurance policy coverages, calculate out-of-pocket patient co-pays, verify PM-JAY (Ayushman Bharat) eligibility, check live hospital bed counts, compare medical treatment costs, find generic drug alternatives, and book medical consultations with AI assistants.

---

## 🌟 Features Blueprint (What, How, Where)

This matrix details the functional architecture, implementation details, and navigation locations for every module in HealthBridge.

| Feature Module | What It Does (What) | How It Works Under the Hood (How) | Where to Find It (Where) |
| :--- | :--- | :--- | :--- |
| **1. Healthcare Financial Assistant** | End-to-end wizard matching disease surgery costs, Ayushman Bharat qualifiers, private co-pays, and medical EMI/loan calculators. | Triggers cost predictions across private corporate centers versus government civil centers, checks scheme rules, and returns loan estimates. | **Affordability Hub** (top header navigation) ➔ *Healthcare Financial Assistant* (default spotlight tab). |
| **2. Government Schemes Checker** | Validates patient eligibility for public healthcare initiatives (Ayushman Bharat) based on family size and household income criteria. | Reads rule criteria from `Backend/config/schemesConfig.json` via the `handleSchemeCheck` handler in [affordabilityController.js](file:///c:/Users/PRIYANSHU%20RAJ/Desktop/Hospital-Appointment/Backend/Controllers/affordabilityController.js). | **Affordability Hub** (top header navigation) ➔ *Insurance & Ayushman Bharat* tab. |
| **3. Co-Pay & Out-of-Pocket Estimator** | Estimates how much a patient will pay out-of-pocket for specific treatments depending on their insurance provider coverage limit. | Computes patient co-pay percentage and deductible limits mapped in the `Hospital` collection schemas. | **Affordability Hub** (top header navigation) ➔ *Insurance & Ayushman Bharat* ➔ *Co-Pay Estimation Form*. |
| **4. Prescription OCR** | Multimodal OCR engine scanning uploaded prescriptions to extract medications, schedule daily reminders, and explain dosage instructions. | Passes Cloudinary file URLs to OpenRouter LLM multimodal completions and updates the user's daily calendar logs. | **Patient Dashboard** ➔ *Prescription OCR* tab. |
| **5. Family Health Dashboard** | Multi-profile management system enabling a single account holder to track reports, vaccinations, and appointments for parents/children. | Stores nested sub-documents inside the `User` schema under `familyMembers` with specialized CRUD operations. | **Patient Dashboard** ➔ *Family Manager* tab. |
| **6. Insurance Claim Assistant** | Analyzes uploaded billing sheets, doctor prescriptions, and medical files to compile claim summaries and alert on missing documentation. | Evaluates file attachments via multimodal completions, identifying inconsistencies, mismatched figures, or missing discharge summaries. | **Patient Dashboard** ➔ *Claim Assistant* tab. |
| **7. Smart Recommendation Engine** | Suggests optimal hospitals matching patient's specific budget, insurance network, max distance threshold, and target waiting time. | Express route `/hospitals/recommendations` queries the `Hospital` model filtering by geographic distance, rating index, and active department listings. | **Affordability Hub** (top header navigation) ➔ *Compare Hospitals* filter panel. |
| **8. Hospital Comparison Table** | Compares partner medical centers sorting by treatment fee ranges, accepted insurance plans, average wait times, and location. | Frontend fetches the hospital list from `/hospitals` and mounts them into a sortable table with filter toggles. | **Affordability Hub** (top header navigation) ➔ *Compare Hospitals* tab grid. |
| **9. Medical Loans & EMI Calculator** | Computes monthly installments for medical procedures at a flat 10% annual rate, and handles loan submission requests. | Computes rates via `/financial/estimate?amount=&months=`. Submits loan applications to the `MedicalLoan` collection via `POST /financial/loan-request`. | **Affordability Hub** (top header navigation) ➔ *Medical Loans / EMI* tab. |
| **10. Live Bed Availability Monitor** | Displays real-time counts of available ICU, General Ward, Private Suite, and Emergency beds across network hospitals. | Feeds live from `/hospitals/beds` route. Integrates directly with the `Hospital` collection's nested beds sub-document schema. | **Affordability Hub** (top header navigation) ➔ *Beds Availability* tab dashboard. |
| **11. Generic Pharmacy Savings** | Matches branded medication names against generic alternatives, displaying price comparisons and percentage savings. | Feeds from `/pharmacy?query=`. Searches the database for matching active ingredients, calculating savings percentage in real-time. | **Affordability Hub** (top header navigation) ➔ *Pharmacy Savings* search panel. |
| **12. Drug Interaction Checker** | Evaluates a list of added medicines to flag dangerous synergistic effects or drug-drug contraindications. | Feeds from `POST /ai/drug-interaction`. Leverages the OpenRouter completion model (offline fallback detects dangerous combos like Warfarin + Aspirin). | **Affordability Hub** (top header navigation) ➔ *Drug Interactions* tab. |
| **13. AI Symptom Checker** | Triage helper that analyzes typed symptoms to recommend clinical specialties and urgency levels (Low/Medium/High). | Calls `/ai/symptom-checker` utilizing the Gemini API to identify urgency levels, general explanations, and matching clinical departments. | **Patient Dashboard** ➔ *AI Symptom Checker* tab. |
| **14. AI Referral & Referral Guides** | Chatbot assistants offering customized financial counseling, co-pay explanations, and hospital referrals. | Implements `/ai/chat-assistant`, `/ai/financial-counsel`, and `/ai/insurance-guide` routes parsing conversational context. | **AI Triage Center** (accessible via bottom-right floating chat bubble or `/ai-guides` page). |
| **15. Unified Booking & Patient Records** | Prevents booking overlapping slots, handles Stripe payments, lets patients download PDF prescriptions, and upload reports. | Checks date conflicts inside `bookingController.js`. Prescriptions render print-ready stylesheets. Reports upload to Cloudinary and fetch AI summaries. | **Patient/Doctor Dashboard** ➔ *My Appointments*, *Medical Reports*, or *Prescriptions* tabs. |

---

## 🛠️ Technology Stack

- **Frontend Client**: React.js, Vite, TailwindCSS (Clinical layout overrides)
- **Backend API**: Node.js, Express.js
- **Database Layer**: MongoDB (Atlas) via Mongoose
- **Integrations**: Stripe API (Payments), Cloudinary API (Media Uploads), OpenRouter API (Gemini LLM)
- **Email Service**: Mailtrap Transactional API (with nodemailer fallback)

---

## 📂 Repository Folder Structure

```
Hospital-Appointment/
├── Backend/              # Node.js Express Backend
│   ├── config/           # PM-JAY eligibility threshold criteria
│   ├── Controllers/      # Business logic handlers (AI, Loans, Costing, Pharmacy)
│   ├── models/           # Hospital & MedicalLoan Mongoose schemas
│   ├── Routes/           # Endpoint routes
│   └── utils/            # Seeder database entries and Mailtrap configurations
├── Frontend/             # React Client Portal & Dashboards
│   ├── src/
│   │   ├── components/   # UI elements & floating chat assistant
│   │   ├── Dashboard/    # Patient, Doctor, & Admin tabs
│   │   ├── pages/        # Affordability Hub & AI Guides pages
│   │   └── routes/       # Protected routers mapping
│   └── package.json
├── PROJECT_DOCUMENTATION.md # Design architecture and database diagrams
└── README.md             # Functional Blueprint and Startup instructions
```

---

## ⚙️ Environment Configurations

Before starting the applications, configure your environment variables.

### Backend Setup (`Backend/.env`)
Create a `.env` file in the `Backend` directory containing:
```env
PORT=5000
MONGO_URL=mongodb+srv://auth_Server:Pu2028@cluster0.vq84e7l.mongodb.net/HealthBridge?retryWrites=true&w=majority
JWT_SECRET_KEY=healthbridge_jwt_secret_token_key_99
CLIENT_SITE_URL=http://localhost:5173
OPENROUTER_API_KEY=your_openrouter_api_key  # Provided key is updated in your active file!
OPENROUTER_MODEL=google/gemini-2.5-flash
MAILTRAP_TOKEN=6bc9abd243d7d2354faf9bc2c557f4ae
MAILTRAP_SENDER=hello@demomailtrap.co
```

### Frontend Setup (`Frontend/.env`)
Create a `.env` file in the `Frontend` directory containing:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_CLOUD_NAME=dnb4jcioy
VITE_UPLOAD_PRESET=doctor_portal
```

---

## 🚀 Running Locally

Follow these steps to run the application on your local machine.

### Prerequisite
Ensure you have **Node.js v18.0.0+** and **npm** installed.

### 1. Start the API Server
```bash
# Navigate to the backend directory
cd Backend

# Install dependencies
npm install

# Start the development server (automatically seeds mock hospitals & beds if empty)
npm run start-dev
```

### 2. Start the Frontend Application
```bash
# Navigate to the frontend directory
cd ../Frontend

# Install dependencies
npm install

# Start the Vite local server
npm run dev
```

The application will launch locally at `http://localhost:5173`.
To read deep system architectures, check out [PROJECT_DOCUMENTATION.md](file:///c:/Users/PRIYANSHU%20RAJ/Desktop/Hospital-Appointment/PROJECT_DOCUMENTATION.md).
