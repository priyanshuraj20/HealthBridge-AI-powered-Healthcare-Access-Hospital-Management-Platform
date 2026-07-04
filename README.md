# HealthBridge – AI-powered Healthcare Access & Hospital Management Platform

HealthBridge is a full-stack, production-quality medical portal designed to resolve transparency in healthcare access. It shifts the paradigm from standard doctor listings to a **hospital-centric network platform**, enabling patients to find partner clinical branches, check live bed status, estimate co-pays, compare generic drug alternatives, verify Ayushman Bharat eligibility, and consult with doctors virtually.

---

## 🏗️ System Architecture & Data Flow

HealthBridge utilizes a modern, robust, and highly concurrent three-tier architecture:

```
                  ┌──────────────────────────────┐
                  │        React Client          │
                  │   (Vite + Tailwind CSS)      │
                  └──────────────┬───────────────┘
                                 │ HTTP / WebSockets
                                 ▼
                  ┌──────────────────────────────┐
                  │      Express API Server      │
                  │         (Node.js)            │
                  └──────────────┬───────────────┘
                                 │ Prisma ORM
                                 ▼
                  ┌──────────────────────────────┐
                  │  Neon Serverless PostgreSQL  │
                  │     (Database Cluster)       │
                  └──────────────────────────────┘
```

### 1. Database & Persistence Layer
* **Database**: Serverless PostgreSQL hosted on Neon, providing rapid scale-to-zero capabilities and optimized connection pools.
* **ORM (Prisma)**: Manages schema definitions, relations, and type safety. Optimized using a `connection_limit=3` pool constraint to prevent client starvation errors on serverless database endpoints.

### 2. Client-Side Presentation
* **Interactive Views**: Built on React.js, compiling to lightweight static assets.
* **Smooth Inertia**: Employs `locomotive-scroll` for fluid momentum scrolling, controlled via React pathname hook transitions.
* **Bilingual Localization**: Includes a client translation lookup engine (`translate.js`). Toggling language switches patient interfaces to Hindi, while locking hospital authorization consoles (Doctor & Org Admin dashboards) strictly to English to maintain administrative consistency.

---

## 🎥 MVP Video Consultation (Deep Dive)

Our primary MVP feature is the **Secure HD Video Consultation Rooms** which allows virtual consultations, live prescription updates, and AI-generated clinical summaries.

```
┌─────────┐            1. Book Video Consult            ┌────────┐
│ Patient ├────────────────────────────────────────────►│ Active │
└─────────┘                                             │ Engine │
     │                                                  └────┬───┘
     │ 3. Match / Join Room                                  │ 2. Request WebRTC Tokens
     ▼                                                       ▼
┌─────────┐         4. HD Peer-to-Peer Stream           ┌────────┐
│VideoSDK │◄────────────────────────────────────────────┤Backend │
└─────────┘                                             └────────┘
```

### Technical Workflow:
1. **Booking/Matching**: A patient schedules an online consultation or triggers a **🔴 Emergency Live Consult** on the Telemedicine dashboard.
2. **Room Creation**: The backend generates a unique `meetingRoom` ID (e.g. `healthbridge-room-395810`).
3. **Secure Token Generation**: The backend uses its `VIDEOSDK_API_KEY` and `VIDEOSDK_SECRET` to sign custom HMAC-SHA256 JWT tokens. These contain specific permission grants (`allow_join: true`, `allow_mod: true`) tailored to each participant's role (patient/doctor).
4. **WebRTC Stream Launch**: Both patient and doctor join the room from their dashboards. The frontend loads the VideoSDK `MeetingProvider` with the tokens, establishing a direct peer-to-peer audio-video stream.
5. **Real-time Prescriptions**: During the call, doctors type and submit generic/branded medicines, which instantly write to the database and update the patient's record timeline.
6. **AI visit Summaries**: The AI counselor reads call logs and outputs clinical summaries of diagnosis and next steps.

---

## 🌟 Comprehensive Features Blueprint

| Feature Module | What It Does (What) | How It Works (Technical Implementation) |
| :--- | :--- | :--- |
| **1. Emergency Telemedicine** | Connects patients instantly with available doctors for high-fever or sudden emergency cases. | `POST /bookings/book-instant` finds online telemedicine doctors, creates pre-confirmed bookings, bypasses payment gateways, and generates room links immediately. |
| **2. Hospital Discovery** | Lists network partner hospitals and clinics rather than individual doctor lists. | Fetches database records from the `Hospital` model. Clicking a hospital card reveals details where specialty categories filter matching doctors. |
| **3. Geolocation Sorting** | Sorts hospitals by physical proximity. | Obtains coordinates from the browser Geolocation API and computes GPS distance relative to mapped hospital city coordinates using the **Haversine formula**. |
| **4. Cost Estimate Auditor** | Compares surgical procedure costs side-by-side. | Parses treatment price ranges across private clinics versus government civil centers, outlining potential patient cost exposure. |
| **5. Co-Pay Estimator** | Calculates out-of-pocket costs. | Mapped in the database, it applies co-insurance and deductible thresholds based on the patient's insurance provider. |
| **6. Generic Drug Savings** | Recommends cheaper generic drug equivalents. | Queries the pharmacy database index by active chemical ingredient to discover generic drug equivalents, saving patients 80%+ on prescription costs. |
| **7. Prescription OCR Scanner** | Digitizes doctor prescriptions from photo uploads. | Passes the Cloudinary file URL to OpenRouter LLM multimodal completions, extracting dosages, notes, and configuring daily reminder schedules. |
| **8. Ayushman Bharat Portal** | Validates government scheme eligibility. | Evaluates household monthly income and family member constraints against rules loaded from `schemesConfig.json`. |
| **9. Live Bed Monitor** | Tracks ICU, General, and Private bed vacancies. | Integrates with database-level bed counts updating in real-time on the patient's financial helper dashboard. |
| **10. Drug-Drug Interactions** | Detects unsafe chemical synergies. | An AI scanner checks potential warnings (such as Warfarin + Aspirin) to avoid drug-drug contraindications. |
| **11. Family Health Vault** | Multi-profile tracking for dependents. | Mapped to the `Patient` model, allows adding family profiles for consolidated vaccination, booking, and report tracking. |

---

## ⚙️ Environment Configurations

### Backend Setup (`Backend/.env`)
Create a `.env` file in the `Backend` directory containing:
```env
PORT=5000
DATABASE_URL="postgres://user:password@neon-host/db?sslmode=require&connection_limit=3"
JWT_SECRET_KEY=healthbridge_jwt_secret_token_key_99
CLIENT_SITE_URL=http://localhost:5173
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.5-flash
VIDEOSDK_API_KEY=your_videosdk_api_key
VIDEOSDK_SECRET=your_videosdk_secret
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

### Prerequisite
Ensure you have **Node.js v18.0.0+** and **npm** installed.

### 1. Start the API Server
```bash
cd Backend
npm install
npm run start
```

### 2. Start the Frontend Application
```bash
cd ../Frontend
npm install
npm run dev
```

The application will launch locally at `http://localhost:5173`.
