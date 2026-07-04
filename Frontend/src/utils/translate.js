const translations = {
  // Navigation Links
  "Home": "होम",
  "Find Hospitals": "अस्पताल खोजें",
  "Telemedicine": "टेलीमेडिसिन",
  "Affordability": "वहनीयता",
  "AI Assistant": "एआई सहायक",
  "Contact": "संपर्क",
  "Login": "लॉगिन",

  // Landing Page Strings
  "Discover Partner Hospitals & Clinics": "अस्पताल और क्लीनिक खोजें",
  "Search hospital name, location, surgery name...": "अस्पताल का नाम, स्थान, सर्जरी खोजें...",
  "All Specialties": "सभी विशेषज्ञताएं",
  "All Insurances": "सभी बीमा",
  "OPD Wait Time": "ओपीडी प्रतीक्षा समय",
  "Estimated Cost": "अनुमानित लागत",
  "Distance": "दूरी",
  "Emergency": "आपातकालीन",
  "Supported Insurances": "स्वीकृत बीमा",
  "AI-Powered Digital Healthcare Platform": "एआई-संचालित डिजिटल स्वास्थ्य सेवा मंच",
  "From Symptoms to Recovery —": "लक्षणों से ठीक होने तक —",
  "Everything in One Platform": "सब कुछ एक ही मंच पर",
  "Find hospitals, compare treatment costs, check insurance eligibility, book video consultations, upload reports, receive AI-powered medical summaries, and manage your family's health from one secure platform.": "अस्पतालों को खोजें, उपचार की लागतों की तुलना करें, बीमा पात्रता की जांच करें, वीडियो परामर्श बुक करें, रिपोर्ट अपलोड करें, एआई-संचालित चिकित्सा सारांश प्राप्त करें, और एक ही सुरक्षित मंच से अपने परिवार के स्वास्थ्य का प्रबंधन करें।",
  "Find a Hospital": "अस्पताल खोजें",
  "Talk to AI": "एआई से बात करें",
  "24/7": "24/7",
  "Live Bed Monitoring": "लाइव बेड मॉनिटरिंग",
  "100%": "100%",
  "Ayushman Bharat": "आयुष्मान भारत",
  "8+": "8+",
  "AI-Powered Tools": "एआई-संचालित उपकरण",

  // Profile Pages
  "Healthcare Home": "स्वास्थ्य सेवा होम",
  "Profile Settings": "प्रोफ़ाइल सेटिंग्स",
  "My Appointments": "मेरे अपॉइंटमेंट",
  "Medical Reports": "मेडिकल रिपोर्ट",
  "Prescriptions": "पर्चे",
  "Symptom Checker": "लक्षण जांचक",
  "Prescription OCR": "पर्चा ओसीआर",
  "Family & Ayushman Vault": "परिवार और आयुष्मान वॉल्ट",

  // Patient Dashboard Home
  "HealthBridge Patient Workspace": "हेल्थब्रिज रोगी कार्यक्षेत्र",
  "Welcome back": "स्वागत है",
  "Quick Operations": "त्वरित संचालन",
  "Check Symptoms": "लक्षण जांचें",
  "Compare Costs": "लागत तुलना",
  "Upcoming Consultations": "आने वाले अपॉइंटमेंट",
  "My Health Profile": "मेरी स्वास्थ्य प्रोफ़ाइल",
  "Blood Group": "रक्त समूह",
  "Gender": "लिंग",
  "Emergency Contact": "आपातकालीन संपर्क",
  "Dosage Reminders": "दवा अनुस्मारक",
  "Cashless Insurance": "कैशलेस बीमा",
  "HealthBridge AI Coordinator": "हेल्थब्रिज एआई समन्वयक",
  "Start AI Symptom Check": "एआई लक्षण जांच शुरू करें",

  // Affordability Hub
  "Healthcare Access & Affordability Hub": "स्वास्थ्य सेवा पहुंच और वहनीयता हब",
  "Smart Out-of-Pocket Cost Estimator": "स्मार्ट आउट-ऑफ-पॉकेट लागत अनुमानक",
  "Download Cost Report": "लागत रिपोर्ट डाउनलोड करें",
  "Select Treatment / Surgery": "उपचार / सर्जरी का चयन करें",
  "Select Insurance Provider": "बीमा प्रदाता का चयन करें",
  "Monthly Family Income (INR)": "मासिक पारिवारिक आय (रुपये)",
  "Household Family Size": "परिवार का आकार",
  "Run Financial Assessment": "वित्तीय मूल्यांकन चलाएं",
  "Ayushman Bharat Covered": "आयुष्मान भारत योजना अंतर्गत कवर",
  "Hospital Cost Comparison Sheet": "अस्पताल लागत तुलना पत्रक",
  "Healthcare Generic Medicine Savings Advisor": "जेनेरिक दवा बचत सलाहकार",
  "Medical Loan & EMI Planner": "मेडिकल लोन और ईएमआई प्लानर",
  "Total Savings": "कुल बचत",
  "Interest Rate (Flat)": "ब्याज दर",
  "Total Interest Paid": "कुल देय ब्याज",
  "Total Repayment Amount": "कुल पुनर्भुगतान राशि",
  "Estimated Monthly EMI": "अनुमानित मासिक ईएमआई",
  "Apply for EMI Plan": "ईएमआई प्लान के लिए आवेदन करें"
};

export const t = (key) => {
  const lang = localStorage.getItem("lang") || "en";
  const role = localStorage.getItem("role") || "patient";
  if (role === "doctor" || role === "hospital") return key;
  if (lang === "en") return key;
  return translations[key] || key;
};
