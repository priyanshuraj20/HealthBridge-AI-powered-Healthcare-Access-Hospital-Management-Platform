import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BsArrowRightShort, BsArrowLeft, BsArrowRight } from "react-icons/bs";
import {
  FaStethoscope, FaFileUpload, FaVideo, FaRobot, FaBell,
  FaShieldAlt, FaHospital, FaMoneyBillWave, FaUserMd,
  FaHeartbeat, FaClipboardList, FaUsers, FaChartLine,
  FaCheckCircle, FaComments
} from "react-icons/fa";
import DoctorList from "../components/Doctors/DoctorList";
import Testimonials from "../components/Testimonials/Testimonials";
import FaqList from "../components/Faq/FaqList";

/* ─── Feature slider data (defined outside component) ─── */
const FEATURES = [
  {
    tag: "Financial Assistant", color: "teal",
    title: "Healthcare Cost Estimator",
    desc: "Compare surgery costs across government and private hospitals. Verify Ayushman Bharat eligibility and calculate EMI options before you step into a hospital.",
    link: "/affordability",
    cta: "Open Financial Assistant",
    bullets: ["Cross-hospital cost comparison", "Ayushman Bharat eligibility check", "Auto EMI & loan options"],
    mockItems: [
      { label: "Apollo Hospitals", value: "₹95,000", style: "bg-gray-50" },
      { label: "Civil Hospital", value: "₹10,000 (Free)", style: "bg-emerald-50 border-emerald-200 text-emerald-800" },
      { label: "EMI Option", value: "₹3,200/mo", style: "bg-purple-50 border-purple-200 text-purple-800" },
    ]
  },
  {
    tag: "Telemedicine", color: "blue",
    title: "Free Follow-up Video Consultations",
    desc: "After your physical visit, upload lab reports and get a FREE video consultation with the same doctor — no second hospital trip — within 10 days.",
    link: "/login",
    cta: "Book Video Consultation",
    bullets: ["Free follow-up within 10 days", "Encrypted Jitsi video calls", "AI-generated consultation summary"],
    steps: ["Physical Appointment", "Lab Tests Prescribed", "Reports Uploaded", "Free Video Call"]
  },
  {
    tag: "AI Symptom Checker", color: "indigo",
    title: "AI Health Navigator",
    desc: "Describe symptoms in plain language. The AI tells you whether you need emergency care, a specialist, or can safely manage at home.",
    link: "/ai-guides",
    cta: "Check Symptoms Now",
    bullets: ["Emergency triage detection", "Specialist routing", "Home care recommendations"],
    chatLines: [
      { who: "User", text: "Chest pain, sweating, left arm pain.", cls: "bg-gray-50" },
      { who: "AI", text: "⚠ HIGH RISK — Go to Emergency immediately.", cls: "bg-red-50 border border-red-200 text-red-800 font-semibold" }
    ]
  },
  {
    tag: "Insurance Claim", color: "rose",
    title: "AI Insurance Claim Assistant",
    desc: "Upload bills and discharge summaries. AI audits the claim, identifies missing documents, and generates a submission-ready summary.",
    link: "/login",
    cta: "Start Claim Audit",
    bullets: ["AI document checklist validation", "Missing form detection", "Submission-ready summary export"],
    docs: [
      { label: "Hospital Invoice", ok: true },
      { label: "Doctor Certificate", ok: true },
      { label: "Discharge Summary", ok: false },
      { label: "Prescription Slip", ok: false }
    ]
  },
  {
    tag: "Family Vault", color: "purple",
    title: "Family Health Dashboard",
    desc: "Manage health records for your entire family — parents, children, grandparents — from one account. Track vaccinations and appointments for every member.",
    link: "/login",
    cta: "Open Family Vault",
    bullets: ["Multi-member health profiles", "Vaccination status tracking", "Consolidated medical records"],
    members: [
      { name: "Ramesh (Father)", tag: "BP Monitor", ok: false },
      { name: "Priya (Self)", tag: "All Clear", ok: true },
      { name: "Aarav (Son)", tag: "Vaccination Pending", ok: false }
    ]
  }
];

/* ─── Small helpers ─────────────────────────────────── */
const HERO_IMGS = [
  "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782951550/famous_hospital_building.jpg",
  "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782951551/famous_doctor_portrait.jpg"
];

function SectionLabel({ children }) {
  return <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primaryColor mb-3">{children}</p>;
}

function FeatureMock({ f }) {
  if (f.mockItems) {
    return (
      <div className="space-y-2 w-full text-xs">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Appendix Surgery · Cashless Eligible</p>
        {f.mockItems.map(item => (
          <div key={item.label} className={`flex justify-between p-2.5 rounded-xl border text-xs font-semibold ${item.style || "border-gray-200"}`}>
            <span>{item.label}</span><span>{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  if (f.steps) {
    return (
      <div className="space-y-3 w-full text-xs">
        {f.steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${i < 3 ? "bg-primaryColor text-white" : "bg-gray-100 text-gray-400 border"}`}>
              {i < 3 ? <FaCheckCircle size={12} /> : i + 1}
            </div>
            <span className={i < 3 ? "font-semibold text-headingColor" : "text-gray-400"}>{s}</span>
          </div>
        ))}
      </div>
    );
  }
  if (f.chatLines) {
    return (
      <div className="space-y-2 w-full text-xs">
        {f.chatLines.map(l => (
          <div key={l.who} className={`p-2.5 rounded-xl text-[11px] ${l.cls}`}>
            <span className="font-bold text-indigo-600">{l.who}: </span>{l.text}
          </div>
        ))}
      </div>
    );
  }
  if (f.docs) {
    return (
      <div className="space-y-2 w-full text-xs">
        {f.docs.map(d => (
          <div key={d.label} className={`flex items-center gap-2 p-2 rounded-lg ${d.ok ? "text-green-700" : "text-red-500"}`}>
            <span>{d.ok ? "✔" : "✗"}</span><span className="font-medium">{d.label}</span>
            <span className="ml-auto text-[10px]">{d.ok ? "Verified" : "Missing"}</span>
          </div>
        ))}
      </div>
    );
  }
  if (f.members) {
    return (
      <div className="space-y-2 w-full text-xs">
        {f.members.map(m => (
          <div key={m.name} className={`flex justify-between items-center p-2.5 rounded-xl border text-[11px] ${m.ok ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
            <span className="font-semibold">{m.name}</span>
            <span className={m.ok ? "text-green-700 font-bold" : "text-amber-700 font-bold"}>{m.tag}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const [heroImg, setHeroImg]     = useState(0);
  const [slideIdx, setSlideIdx]   = useState(0);
  const [fadeOn, setFadeOn]       = useState(true);

  // Hero image carousel
  useEffect(() => {
    const t = setInterval(() => setHeroImg(p => (p + 1) % HERO_IMGS.length), 4500);
    return () => clearInterval(t);
  }, []);

  // Feature slider auto-advance
  const goSlide = useCallback((next) => {
    setFadeOn(false);
    setTimeout(() => { setSlideIdx(next % FEATURES.length); setFadeOn(true); }, 220);
  }, []);

  useEffect(() => {
    const t = setInterval(() => goSlide((slideIdx + 1) % FEATURES.length), 7000);
    return () => clearInterval(t);
  }, [slideIdx, goSlide]);

  const cur  = FEATURES[slideIdx];
  const next = FEATURES[(slideIdx + 1) % FEATURES.length];

  return (
    <div className="bg-white">

      {/* ─── Moving Features Line (just below header, thoda patla) ─── */}
      <div className="w-full bg-[#f3faf9] border-b border-teal-100 overflow-hidden py-2 shadow-sm">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
          {[
            { ico: "🩺", text: "AI Symptom Checker" },
            { ico: "📄", text: "Report Analyzer" },
            { ico: "🎥", text: "Video Consultation" },
            { ico: "💰", text: "Cost Comparison" },
            { ico: "🏥", text: "Insurance Checker" },
            { ico: "🚑", text: "Emergency Triage" },
            { ico: "📅", text: "Smart Appointments" },
            { ico: "🔔", text: "Medicine Reminder" },
            { ico: "👨‍👩‍👧", text: "Family Health Vault" },
            { ico: "📈", text: "Recovery Tracker" }
          ].concat([
            { ico: "🩺", text: "AI Symptom Checker" },
            { ico: "📄", text: "Report Analyzer" },
            { ico: "🎥", text: "Video Consultation" },
            { ico: "💰", text: "Cost Comparison" },
            { ico: "🏥", text: "Insurance Checker" },
            { ico: "🚑", text: "Emergency Triage" },
            { ico: "📅", text: "Smart Appointments" },
            { ico: "🔔", text: "Medicine Reminder" },
            { ico: "👨‍👩‍👧", text: "Family Health Vault" },
            { ico: "📈", text: "Recovery Tracker" }
          ]).map((feat, idx) => (
            <span key={idx} className="inline-flex items-center gap-2 text-[11px] font-bold text-teal-800 uppercase tracking-wider">
              <span>{feat.ico}</span>
              <span>{feat.text}</span>
              <span className="text-teal-300 ml-4">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="pt-16 pb-24 bg-gradient-to-b from-[#f0fafa] via-white to-white">
        <div className="container max-w-[1240px] mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-10 items-center">

            {/* LEFT */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
                </span>
                AI-Powered Digital Healthcare Platform
              </span>

              <h1 className="text-[40px] sm:text-[52px] font-[900] leading-[1.1] tracking-tight text-headingColor">
                From Symptoms to Recovery —{" "}
                <span className="text-primaryColor">Everything in One Platform</span>
              </h1>

              <p className="text-[15px] leading-[1.9] text-textColor max-w-[560px]">
                Find doctors, compare treatment costs, check insurance eligibility, book video consultations,
                upload reports, receive AI-powered medical summaries, and manage your family's health from one secure platform.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/doctors")}
                  className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
                >
                  Find a Doctor <BsArrowRightShort size={18} />
                </button>
                <button
                  onClick={() => navigate("/ai-guides")}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-headingColor font-bold text-sm px-8 py-3.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <FaRobot className="text-primaryColor" /> Talk to AI
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 max-w-[480px] pt-2">
                {[["24/7","Live Bed Monitoring"],["100%","Ayushman Bharat"],["8+","AI-Powered Tools"]].map(([v, l]) => (
                  <div key={l} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 text-center">
                    <p className="text-[22px] font-[900] text-headingColor">{v}</p>
                    <p className="text-[9px] uppercase font-bold tracking-wider text-textColor mt-1 leading-3">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-5 relative w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-gray-150 bg-gray-50 group">
              {HERO_IMGS.map((src, i) => (
                <img
                  key={i} src={src} alt="Famous Hospital / Doctor"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${heroImg === i ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                />
              ))}
              {/* Subtle visual gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-6 z-20">
                <p className="text-white text-[10px] font-extrabold uppercase tracking-widest opacity-90 mb-1">HealthBridge Care</p>
                <p className="text-white text-base font-extrabold leading-tight">Unified Healthcare Journey, Simplified by AI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 1 — AI HEALTH ASSISTANT
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container max-w-[1240px] mx-auto px-4">
          <div className="text-center max-w-[600px] mx-auto mb-14">
            <SectionLabel>Section 01 — AI Health Assistant</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold text-headingColor leading-tight">
              Not Sure What's Wrong?{" "}
              <span className="text-primaryColor">Ask the AI First.</span>
            </h2>
            <p className="text-sm text-textColor mt-4 leading-7">
              Describe your symptoms in plain language. Our AI triages your condition and routes you to the right care — before you visit any hospital.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <FaStethoscope size={20} />, color: "teal",   title: "Doctor Needed?",     desc: "AI analyses severity and recommends the right specialist, nearest availability, and typical wait times." },
              { icon: <FaBell size={20} />,        color: "rose",   title: "Emergency Detected?", desc: "Critical symptom patterns trigger an immediate emergency alert with nearest hospital directions." },
              { icon: <FaHeartbeat size={20} />,   color: "indigo", title: "Home Care?",          desc: "Mild conditions get step-by-step home management advice, hydration tips, and when to escalate." },
            ].map(({ icon, color, title, desc }) => {
              const bg = { teal:"bg-teal-50 text-primaryColor border-teal-100", rose:"bg-rose-50 text-rose-600 border-rose-100", indigo:"bg-indigo-50 text-indigo-600 border-indigo-100" }[color];
              return (
                <div key={title} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all space-y-4">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${bg}`}>{icon}</div>
                  <h3 className="font-extrabold text-headingColor text-sm">{title}</h3>
                  <p className="text-xs text-textColor leading-6">{desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => navigate("/ai-guides")} className="bg-primaryColor text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-md hover:bg-teal-700 transition-all inline-flex items-center gap-2">
              <FaComments /> Check My Symptoms <BsArrowRightShort size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 2 — DOCTOR DISCOVERY
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f6fafa] border-t border-gray-100">
        <div className="container max-w-[1240px] mx-auto px-4">
          <div className="text-center max-w-[620px] mx-auto mb-12">
            <SectionLabel>Section 02 — Doctor & Hospital Discovery</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold text-headingColor leading-tight">
              Find the Right Doctor,{" "}
              <span className="text-primaryColor">with Full Transparency.</span>
            </h2>
            <p className="text-sm text-textColor mt-4 leading-7">
              Real-time ICU availability, insurance acceptance, live wait times, verified reviews, and transparent fees — before you book.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[["🏥","Insurance Accepted"],["🛏","ICU Availability"],["⏱","Live Wait Time"],["⭐","Verified Reviews"],["💰","Transparent Fees"],["📍","Nearby Hospitals"]].map(([ico, lbl]) => (
              <div key={lbl} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs font-semibold text-headingColor shadow-sm">
                <span>{ico}</span>{lbl}
              </div>
            ))}
          </div>

          <DoctorList />

          <div className="text-center mt-10">
            <button onClick={() => navigate("/doctors")} className="border border-primaryColor text-primaryColor font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-primaryColor hover:text-white transition-all inline-flex items-center gap-2">
              View All Doctors <BsArrowRightShort size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 3 — AFFORDABILITY HUB
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container max-w-[1240px] mx-auto px-4">
          <div className="text-center max-w-[600px] mx-auto mb-12">
            <SectionLabel>Section 03 — Affordability Hub</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold text-headingColor leading-tight">
              Healthcare Shouldn't Break{" "}
              <span className="text-primaryColor">Your Bank.</span>
            </h2>
            <p className="text-sm text-textColor mt-4 leading-7">
              HealthBridge's financial toolkit helps you understand costs, check scheme eligibility, and plan payments before stepping into a hospital.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon:<FaMoneyBillWave size={18}/>, color:"teal",   title:"Treatment Cost Estimator",  desc:"Compare surgery costs across government, trust, and private hospitals side by side." },
              { icon:<FaShieldAlt size={18}/>,     color:"indigo", title:"Insurance Eligibility Check",desc:"Verify your coverage, co-pay, sub-limits, and cashless hospital network." },
              { icon:<FaHospital size={18}/>,      color:"green",  title:"Ayushman Bharat Check",     desc:"Instantly verify if you qualify for the national cashless health scheme." },
              { icon:<FaClipboardList size={18}/>, color:"amber",  title:"Generic Pharmacy Audit",    desc:"Find 80%+ cheaper generic equivalents for your branded prescriptions." },
              { icon:<FaChartLine size={18}/>,     color:"purple", title:"Medical Loan & EMI",        desc:"Apply for financing at flat 10% with EMI schedules pre-filled from cost data." },
              { icon:<FaUsers size={18}/>,         color:"rose",   title:"Government Schemes",        desc:"Access Central & State health schemes, PM-JAY hospitals, and welfare funds." },
            ].map(({ icon, color, title, desc }) => {
              const cls = {teal:"bg-teal-50 text-primaryColor border-teal-100",indigo:"bg-indigo-50 text-indigo-600 border-indigo-100",green:"bg-green-50 text-green-600 border-green-100",amber:"bg-amber-50 text-amber-600 border-amber-100",purple:"bg-purple-50 text-purple-600 border-purple-100",rose:"bg-rose-50 text-rose-600 border-rose-100"}[color];
              return (
                <div key={title} onClick={() => navigate("/affordability")} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group space-y-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${cls}`}>{icon}</div>
                  <h3 className="font-extrabold text-headingColor text-sm group-hover:text-primaryColor transition-colors">{title}</h3>
                  <p className="text-xs text-textColor leading-6">{desc}</p>
                  <span className="text-primaryColor text-xs font-bold flex items-center gap-1">Open <BsArrowRightShort size={14} /></span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 4 — TELEMEDICINE TIMELINE
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-[#f0fafa] to-white border-t border-gray-100">
        <div className="container max-w-[1240px] mx-auto px-4">
          <div className="text-center max-w-[600px] mx-auto mb-14">
            <SectionLabel>Section 04 — Telemedicine</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold text-headingColor leading-tight">
              No Second Hospital Visit.{" "}
              <span className="text-primaryColor">Free Follow-up on Video.</span>
            </h2>
            <p className="text-sm text-textColor mt-4 leading-7">
              Upload lab reports after your physical visit. Get a free video consultation with the same doctor within 10 days. No extra ₹500 fee.
            </p>
          </div>

          <div className="relative max-w-[660px] mx-auto">
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primaryColor to-indigo-300 rounded-full" />
            {[
              { ico: <FaUserMd />,       color:"bg-teal-500",   label:"Physical Consultation",    sub:"Book appointment → visit doctor → receive prescription" },
              { ico: <FaClipboardList/>, color:"bg-blue-500",   label:"Lab Tests Prescribed",     sub:"Doctor prescribes CBC, X-Ray, Blood Sugar — visible on your dashboard" },
              { ico: <FaFileUpload/>,    color:"bg-amber-500",  label:"Upload Reports",           sub:"Upload PDF or photo — stored securely on Cloudinary" },
              { ico: <FaVideo />,        color:"bg-indigo-500", label:"Free Follow-up Video Call",sub:"One-click call with the same doctor — ₹0 cost, within 10 days" },
              { ico: <FaRobot />,        color:"bg-purple-500", label:"AI Visit Summary",         sub:"AI extracts diagnosis, medications & reminders automatically" },
              { ico: <FaBell />,         color:"bg-green-500",  label:"Medicine Reminders",       sub:"Automated dose reminders synced to your patient dashboard" },
            ].map(({ ico, color, label, sub }) => (
              <div key={label} className="relative flex items-start gap-6 mb-8 pl-16">
                <div className={`absolute left-0 w-12 h-12 rounded-full ${color} flex items-center justify-center text-white shadow-md z-10`}>
                  {ico}
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex-1 hover:shadow-md transition-all">
                  <p className="font-extrabold text-headingColor text-sm">{label}</p>
                  <p className="text-xs text-textColor mt-1 leading-5">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <button onClick={() => navigate("/login")} className="bg-primaryColor text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-md hover:bg-teal-700 transition-all inline-flex items-center gap-2">
              <FaVideo /> Book Video Consultation <BsArrowRightShort size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 5 — FEATURE SLIDER
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container max-w-[1240px] mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <SectionLabel>Section 05 — AI Feature Suite</SectionLabel>
              <h2 className="text-3xl font-extrabold text-headingColor leading-tight">
                Explore All <span className="text-primaryColor">AI-Powered Tools</span>
              </h2>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={() => goSlide((slideIdx - 1 + FEATURES.length) % FEATURES.length)}
                className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 text-slate-500 transition-all"
              >
                <BsArrowLeft size={16} />
              </button>
              <button
                onClick={() => goSlide((slideIdx + 1) % FEATURES.length)}
                className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 text-slate-500 transition-all"
              >
                <BsArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2 mb-8">
            {FEATURES.map((_, i) => (
              <button key={i} onClick={() => goSlide(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIdx ? "bg-primaryColor w-8" : "bg-gray-200 w-4"}`} />
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Active card — 2 cols */}
            <div
              onClick={() => navigate(cur.link)}
              className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-7 shadow-sm hover:shadow-md hover:border-primaryColor/40 hover:-translate-y-0.5 cursor-pointer transition-all flex flex-col justify-between"
              style={{ opacity: fadeOn ? 1 : 0, transform: fadeOn ? "translateY(0)" : "translateY(6px)", transition: "opacity 220ms ease, transform 220ms ease" }}
            >
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full">
                    {cur.tag}
                  </span>
                  <h3 className="text-xl font-extrabold text-headingColor leading-tight">{cur.title}</h3>
                  <p className="text-xs text-textColor leading-6">{cur.desc}</p>
                  <ul className="space-y-2">
                    {cur.bullets.map(b => (
                      <li key={b} className="flex items-center gap-2 text-[11px] text-textColor font-medium">
                        <span className="text-primaryColor font-bold">✔</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 min-h-[160px] flex items-center">
                  <FeatureMock f={cur} />
                </div>
              </div>
              <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between">
                <span className="bg-primaryColor text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-1.5">
                  {cur.cta} <BsArrowRightShort size={16} />
                </span>
                <span className="text-[10px] text-gray-400">Click to open →</span>
              </div>
            </div>

            {/* Next peek card — 1 col */}
            <div
              onClick={() => goSlide((slideIdx + 1) % FEATURES.length)}
              className="lg:col-span-1 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all flex flex-col justify-between opacity-80 hover:opacity-100"
            >
              <div className="space-y-4">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Next Up</span>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full w-fit">
                  {next.tag}
                </span>
                <h4 className="font-extrabold text-headingColor text-base leading-tight">{next.title}</h4>
                <p className="text-xs text-textColor leading-6">{next.desc.slice(0, 110)}…</p>
              </div>
              <div className="pt-4 border-t border-gray-100 mt-4">
                <span className="text-xs font-bold text-primaryColor inline-flex items-center gap-1">
                  Explore <BsArrowRightShort size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 6 — PATIENT JOURNEY
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f6fafa] border-t border-gray-100">
        <div className="container max-w-[1240px] mx-auto px-4">
          <div className="text-center max-w-[600px] mx-auto mb-14">
            <SectionLabel>Section 06 — Patient Journey</SectionLabel>
            <h2 className="text-3xl font-extrabold text-headingColor leading-tight">
              One Platform.{" "}
              <span className="text-primaryColor">Your Entire Healthcare Journey.</span>
            </h2>
            <p className="text-sm text-textColor mt-4 leading-7">
              HealthBridge isn't just a booking app — it's your care companion from the first symptom to full recovery.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step:"01", ico:"🤒", label:"Symptoms",        sub:"Describe what you feel" },
              { step:"02", ico:"🤖", label:"AI Guidance",     sub:"Instant triage result" },
              { step:"03", ico:"📅", label:"Book Doctor",     sub:"Choose specialist & slot" },
              { step:"04", ico:"🏥", label:"Hospital Visit",  sub:"Physical consultation" },
              { step:"05", ico:"📄", label:"Upload Reports",  sub:"Secure cloud storage" },
              { step:"06", ico:"🎥", label:"Video Follow-up", sub:"Free call, same doctor" },
              { step:"07", ico:"💊", label:"Prescription",    sub:"AI OCR + dose reminders" },
              { step:"08", ico:"📈", label:"Recovery",        sub:"AI summary & tracking" },
            ].map(({ step, ico, label, sub }) => (
              <div key={step} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm text-center hover:shadow-md hover:-translate-y-0.5 transition-all space-y-2">
                <div className="text-2xl">{ico}</div>
                <div className="text-[9px] text-primaryColor font-extrabold uppercase tracking-widest">Step {step}</div>
                <div className="font-extrabold text-headingColor text-sm">{label}</div>
                <div className="text-[10px] text-textColor leading-4">{sub}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button onClick={() => navigate("/signup")} className="bg-primaryColor text-white font-bold text-sm px-10 py-4 rounded-xl shadow-lg hover:bg-teal-700 transition-all inline-flex items-center gap-2">
              Start Your Healthcare Journey <BsArrowRightShort size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURE GRID — 10 capabilities
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container max-w-[1240px] mx-auto px-4">
          <div className="text-center max-w-[520px] mx-auto mb-12">
            <SectionLabel>Platform Capabilities</SectionLabel>
            <h2 className="text-3xl font-extrabold text-headingColor">
              Everything a Patient Needs.{" "}
              <span className="text-primaryColor">Nothing They Don't.</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { ico:"🩺", label:"AI Symptom Checker",  link:"/ai-guides" },
              { ico:"📄", label:"Report Analyzer",      link:"/ai-guides" },
              { ico:"🎥", label:"Video Consultation",   link:"/login" },
              { ico:"💰", label:"Cost Comparison",      link:"/affordability" },
              { ico:"🏥", label:"Insurance Checker",    link:"/affordability" },
              { ico:"🚑", label:"Emergency Triage",     link:"/ai-guides" },
              { ico:"📅", label:"Smart Appointments",   link:"/doctors" },
              { ico:"🔔", label:"Medicine Reminder",    link:"/login" },
              { ico:"👨‍👩‍👧", label:"Family Health Vault", link:"/login" },
              { ico:"📈", label:"Recovery Tracker",     link:"/login" },
            ].map(({ ico, label, link }) => (
              <div
                key={label}
                onClick={() => navigate(link)}
                className="bg-[#f6fafa] border border-gray-150 rounded-2xl p-5 text-center hover:bg-teal-50 hover:border-teal-200 hover:-translate-y-0.5 transition-all cursor-pointer space-y-2"
              >
                <div className="text-2xl">{ico}</div>
                <p className="text-[11px] font-extrabold text-headingColor leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f6fafa] border-t border-gray-100">
        <div className="container max-w-[1240px] mx-auto px-4 text-center mb-10">
          <SectionLabel>Patient Stories</SectionLabel>
          <h2 className="text-3xl font-extrabold text-headingColor">What Our Patients Say</h2>
        </div>
        <Testimonials />
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container max-w-[900px] mx-auto px-4">
          <div className="text-center mb-10">
            <SectionLabel>Support</SectionLabel>
            <h2 className="text-3xl font-extrabold text-headingColor">Frequently Asked Questions</h2>
          </div>
          <FaqList />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA BANNER
      ══════════════════════════════════════════════ */}
      <section className="py-24 bg-primaryColor">
        <div className="container max-w-[800px] mx-auto px-4 text-center text-white space-y-6">
          <p className="text-[11px] uppercase font-extrabold tracking-widest opacity-70">Health Bridge</p>
          <h2 className="text-3xl md:text-4xl font-[900] leading-tight">
            An AI-Powered Digital Healthcare Platform
          </h2>
          <p className="text-sm opacity-80 leading-7 max-w-[540px] mx-auto">
            Intelligent care navigation · Telemedicine · Affordability planning · Medical records · Post-treatment support — unified in one patient experience.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button onClick={() => navigate("/signup")} className="bg-white text-primaryColor font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg hover:bg-gray-50 transition-all inline-flex items-center gap-2">
              Create Free Account <BsArrowRightShort size={18} />
            </button>
            <button onClick={() => navigate("/ai-guides")} className="border border-white/40 text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all inline-flex items-center gap-2">
              <FaRobot /> Talk to AI
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
