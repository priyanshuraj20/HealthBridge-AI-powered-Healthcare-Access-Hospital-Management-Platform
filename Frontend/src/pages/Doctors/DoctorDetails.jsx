import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config.js";
import { authContext } from "../../context/AuthContext.jsx";
import ErrorComponent from "../../components/Error/Error.jsx";
import Loader from "../../components/Loader/Loading.jsx";
import { toast } from "react-toastify";
import { 
  BiArrowBack, BiMap, BiCalendar, BiTime, BiCheckCircle, 
  BiDollarCircle, BiChevronRight, BiChevronDown, BiVideo, BiUserPin
} from "react-icons/bi";
import { 
  FaHospital, FaBed, FaShieldAlt, FaListUl, FaUserMd, 
  FaTimes, FaStethoscope, FaArrowRight, FaLock
} from "react-icons/fa";

// Cover images list for hospital gallery
const GALLERY_IMGS = [
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=300&q=80"
];

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(authContext);

  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs: overview, treatments, doctors, reviews
  const [activeTab, setActiveTab] = useState("overview");

  // Booking Flow Wizard state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Select Date/Slot, 2: Consultation Mode & Symptoms
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState("");
  const [consultationType, setConsultationType] = useState("physical");
  const [symptoms, setSymptoms] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchHospitalDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch single hospital branch info
      const hRes = await fetch(`${BASE_URL}/hospitals/${id}`);
      const hJson = await hRes.json();
      if (!hRes.ok) throw new Error(hJson.message || "Failed to load hospital branch.");
      setHospital(hJson.data);

      // 2. Fetch doctors linked to this hospital
      const dRes = await fetch(`${BASE_URL}/doctors?hospital=${id}`);
      const dJson = await dRes.json();
      if (dRes.ok) {
        setDoctors(dJson.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalDetails();
  }, [id]);

  // Group doctors by their specialization (department was removed from the schema)
  const groupedDoctors = doctors.reduce((acc, doc) => {
    const dept = doc.specialization || "General Medicine";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(doc);
    return acc;
  }, {});

  const handleOpenBooking = (doctor) => {
    if (!token) {
      toast.info("Please login to proceed with booking an appointment.");
      navigate("/login");
      return;
    }
    setSelectedDoctor(doctor);
    setBookingStep(1);
    setSelectedDate("");
    setSelectedSlotIndex("");
    setConsultationType("physical");
    setSymptoms("");
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || selectedSlotIndex === "") {
      toast.error("Please fill in appointment date and choose a time slot.");
      return;
    }

    const timeSlot = (selectedDoctor.timeSlots || [])[parseInt(selectedSlotIndex)];
    setBookingLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/checkout-session/${selectedDoctor.id}`, {
        method: "post",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentDate: selectedDate,
          timeSlot,
          symptoms: symptoms.trim(),
          consultationType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Checkout initiation failed");
      }

      const data = await res.json();
      if (data.session_url) {
        // Redirect to Razorpay page
        window.location.href = data.session_url;
      }
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center py-20 min-h-[60vh]"><Loader /></div>;
  if (error) return <div className="py-20"><ErrorComponent errMsg={error} /></div>;
  if (!hospital) return null;

  // API now returns comma-separated strings and a beds[] array
  const specialtiesArr = (hospital.specialties || "").split(",").map(s => s.trim()).filter(Boolean);
  const insurancesArr = (hospital.supportedInsurances || "").split(",").map(s => s.trim()).filter(Boolean);
  const bedInfo = (type) => (hospital.beds || []).find(b => b.type === type) || {};

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Cover Banner */}
      <div className="h-64 md:h-80 bg-slate-900 relative overflow-hidden">
        <img 
          src={hospital.photoUrl || "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80"} 
          alt={hospital.name} 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate("/doctors")}
          className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 p-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <BiArrowBack /> Back to Hospital List
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="container max-w-[1200px] mx-auto px-4 -mt-24 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header info card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 space-y-5">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                      Verified Branch
                    </span>
                    <span className="bg-amber-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      Premium Partner
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-headingColor leading-snug">{hospital.name}</h1>
                  <p className="text-xs text-textColor mt-2 flex items-center gap-1.5">
                    <BiMap className="text-primaryColor text-sm" /> {hospital.address}, {hospital.city}
                  </p>
                </div>
                <div className="text-center bg-gray-50 border p-3 rounded-2xl min-w-[90px] shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Rating</p>
                  <p className="text-2xl font-extrabold text-headingColor mt-0.5">⭐ {hospital.rating}</p>
                </div>
              </div>

              {/* Gallery Mini row */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Hospital Gallery</span>
                <div className="grid grid-cols-3 gap-3">
                  {GALLERY_IMGS.map((url, i) => (
                    <div key={i} className="h-20 rounded-xl overflow-hidden bg-gray-50 border">
                      <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Tab selectors */}
            <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-gray-150 flex gap-2 overflow-x-auto">
              {[
                { id: "overview", label: "Overview & Beds" },
                { id: "treatments", label: "Treatment Cost Guide" },
                { id: "doctors", label: `Doctors & Departments (${doctors.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? "bg-primaryColor text-white shadow-sm" 
                      : "text-textColor hover:bg-gray-50 hover:text-headingColor"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Beds availability */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-3.5">
                    <FaBed className="text-primaryColor" size={16} />
                    <h3 className="font-extrabold text-headingColor text-sm uppercase tracking-wide">Live ICU & Bed Availability</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "General Beds", avail: bedInfo("general").available ?? 12, tot: bedInfo("general").total ?? 50, color: "emerald" },
                      { label: "ICU Beds", avail: bedInfo("icu").available ?? 3, tot: bedInfo("icu").total ?? 10, color: "purple" },
                      { label: "Private Rooms", avail: bedInfo("private").available ?? 5, tot: bedInfo("private").total ?? 15, color: "blue" },
                      { label: "Emergency Beds", avail: bedInfo("emergency").available ?? 2, tot: bedInfo("emergency").total ?? 8, color: "red" }
                    ].map(bed => {
                      const theme = {
                        emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
                        purple: "bg-purple-50 border-purple-100 text-purple-800",
                        blue: "bg-blue-50 border-blue-100 text-blue-800",
                        red: "bg-red-50 border-red-100 text-red-800"
                      }[bed.color];
                      return (
                        <div key={bed.label} className={`${theme} border rounded-2xl p-4 text-center shadow-sm`}>
                          <p className="text-2xl font-[950] leading-none mb-1">{bed.avail}</p>
                          <p className="text-[10px] font-extrabold uppercase tracking-wide leading-none">{bed.label}</p>
                          <p className="text-[9px] opacity-70 mt-1">Available out of {bed.tot}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Specialties & Insurances */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 space-y-4">
                    <h4 className="font-extrabold text-headingColor text-sm border-b pb-3 uppercase tracking-wide">Accepted Insurances</h4>
                    <div className="flex flex-wrap gap-2">
                      {insurancesArr.map((ins, i) => (
                        <span key={i} className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs px-3 py-1.5 rounded-xl font-bold">
                          {ins}
                        </span>
                      ))}
                      {insurancesArr.some(ins => ins.includes("PM-JAY")) && (
                        <span className="bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm">
                          <BiCheckCircle /> PM-JAY Cashless
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 space-y-4">
                    <h4 className="font-extrabold text-headingColor text-sm border-b pb-3 uppercase tracking-wide">Featured Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {specialtiesArr.map((spec, i) => (
                        <span key={i} className="bg-gray-50 border text-textColor text-xs px-3 py-1.5 rounded-xl font-bold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Pricing */}
            {activeTab === "treatments" && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <BiDollarCircle className="text-primaryColor" size={18} />
                  <h3 className="font-extrabold text-headingColor text-sm uppercase tracking-wide">Estimated Surgery & Diagnostic Prices</h3>
                </div>
                <p className="text-xs text-textColor leading-relaxed">
                  Compare estimated treatment packages configured under this hospital branch's HMS. All rates are inclusive of clinical consultation.
                </p>

                <div className="overflow-hidden border border-gray-100 rounded-2xl mt-4">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-headingColor uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-4 border-b">Clinical Service</th>
                        <th className="p-4 border-b text-right">Price Package</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-textColor">
                      {hospital.treatmentCosts?.length > 0 ? (
                        hospital.treatmentCosts.map((tc, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-headingColor">{tc.treatmentName}</td>
                            <td className="p-4 text-right font-extrabold text-teal-700 text-sm">₹{tc.cost.toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-4 text-textColor italic text-center" colSpan={2}>
                            Price package details are not public. Please consult the helpdesk.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Doctors Directory — Specialty Cards → Filtered Doctors */}
            {activeTab === "doctors" && (
              <div className="space-y-6">
                {Object.keys(groupedDoctors).length === 0 ? (
                  <div className="text-center bg-white border border-dashed rounded-3xl p-10 text-textColor">
                    <FaUserMd size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-bold text-sm">No doctors registered at this branch yet.</p>
                  </div>
                ) : !selectedSpecialty ? (
                  /* ── Step 1: Specialty Cards Grid ────────────── */
                  <>
                    <div>
                      <h4 className="font-extrabold text-headingColor text-base">Choose a Specialty</h4>
                      <p className="text-textColor text-xs mt-0.5">Tap a department to view available doctors and book an appointment.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.keys(groupedDoctors).map((dept) => {
                        const SPEC_ICONS = {
                          "Orthopedics": "🦴", "Cardiology": "❤️", "Neurology": "🧠",
                          "Dentistry": "🦷", "Ophthalmology": "👁️", "Dermatology": "🧴",
                          "Pediatrics": "👶", "General Medicine": "🩺", "Psychiatry": "🧘",
                          "Gynecology": "🤰", "ENT": "👂", "Gastroenterology": "🫁",
                          "Urology": "🫘", "Nephrology": "🫀", "Pulmonology": "🫁",
                          "Oncology": "🎗️", "Endocrinology": "⚗️", "Radiology": "📡",
                          "General Surgery": "🔪", "Physiotherapy": "🏃",
                        };
                        const SPEC_COLORS = [
                          "from-teal-400 to-teal-600", "from-rose-400 to-rose-600", "from-indigo-400 to-indigo-600",
                          "from-sky-400 to-sky-600", "from-amber-400 to-amber-600", "from-purple-400 to-purple-600",
                          "from-emerald-400 to-emerald-600", "from-pink-400 to-pink-600", "from-cyan-400 to-cyan-600",
                        ];
                        const idx = Object.keys(groupedDoctors).indexOf(dept);
                        const colorClass = SPEC_COLORS[idx % SPEC_COLORS.length];
                        const icon = SPEC_ICONS[dept] || "🏥";
                        const docCount = groupedDoctors[dept].length;

                        return (
                          <button
                            key={dept}
                            onClick={() => setSelectedSpecialty(dept)}
                            className="group bg-white rounded-3xl border border-gray-150 p-5 shadow-sm hover:shadow-lg hover:border-primaryColor/30 transition-all text-left space-y-3"
                          >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                              {icon}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-headingColor text-sm">{dept}</h5>
                              <p className="text-[10px] text-textColor mt-0.5">{docCount} doctor{docCount > 1 ? "s" : ""} available</p>
                            </div>
                            <div className="flex items-center gap-1 text-primaryColor text-[10px] font-bold group-hover:gap-2 transition-all">
                              View Doctors <FaArrowRight size={8} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* ── Step 2: Filtered Doctors for Selected Specialty ────────────── */
                  <>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedSpecialty(null)}
                        className="bg-gray-100 hover:bg-gray-200 text-headingColor font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-gray-200"
                      >
                        <BiArrowBack size={14} /> All Specialties
                      </button>
                      <div>
                        <h4 className="font-extrabold text-headingColor text-base">{selectedSpecialty}</h4>
                        <p className="text-textColor text-xs mt-0.5">{groupedDoctors[selectedSpecialty]?.length || 0} doctor(s) in this department</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {(groupedDoctors[selectedSpecialty] || []).map((doc) => (
                        <div
                          key={doc.id}
                          className="border border-gray-100 bg-white p-5 rounded-2xl flex justify-between gap-3 shadow-sm hover:shadow-md hover:border-primaryColor/20 transition-all flex-col sm:flex-row"
                        >
                          <div className="flex gap-3">
                            <figure className="w-14 h-14 rounded-full overflow-hidden border-2 border-primaryColor/30 bg-white flex-shrink-0">
                              <img src={doc.photoUrl || "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782951551/famous_doctor_portrait.jpg"} alt="" className="w-full h-full object-cover" />
                            </figure>
                            <div>
                              <h5 className="font-bold text-headingColor text-sm">{doc.name}</h5>
                              <p className="text-[10px] text-textColor font-medium bg-gray-50 px-2 py-0.5 border rounded w-fit mt-1">{doc.specialization || "Physician"}</p>
                              <p className="text-[10px] text-textColor mt-1.5">⭐ {doc.rating || 4.5} rating • {doc.experienceYears || 0} yrs exp</p>
                            </div>
                          </div>

                          <div className="flex flex-col justify-between items-start sm:items-end text-right gap-2.5 border-t sm:border-t-0 pt-2.5 sm:pt-0">
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Offline Fee</p>
                              <p className="font-extrabold text-teal-700 text-xs mt-0.5">₹{doc.offlinePrice} INR</p>
                              {doc.isTelemedicine && doc.onlinePrice !== null && (
                                <>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-1">Online Fee</p>
                                  <p className="font-extrabold text-indigo-700 text-xs mt-0.5">₹{doc.onlinePrice} INR</p>
                                </>
                              )}
                            </div>
                            <button 
                              onClick={() => handleOpenBooking(doc)}
                              className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all shadow-sm shadow-teal-600/10 w-full sm:w-auto"
                            >
                              <BiCalendar /> Book Slot
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Right Column - Side Panel (HMS Helpdesk) */}
          <div className="lg:col-span-4">
            <div className="bg-white border rounded-3xl p-6 shadow-md border-gray-150 space-y-5 h-fit sticky top-24">
              <div className="flex items-center gap-2 border-b pb-3.5">
                <FaHospital className="text-primaryColor" />
                <span className="font-extrabold text-headingColor text-xs uppercase tracking-wider"> HMS Reception Desk</span>
              </div>

              <div className="space-y-4 text-xs text-textColor leading-relaxed">
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 space-y-1.5 shadow-sm">
                  <p className="font-extrabold text-teal-800 text-[11px] uppercase tracking-wide">Live Wait Status</p>
                  <p className="text-headingColor">Current OPD line waiting time is estimated at <strong className="text-primaryColor">{hospital.waitingTime} minutes</strong>.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold text-headingColor">Branch Contact:</span>
                    <span>{hospital.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold text-headingColor">Op. Status:</span>
                    <span className="text-green-600 font-bold uppercase text-[10px]">Open 24 Hours</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold text-headingColor">Lic. Registry:</span>
                    <span className="font-mono text-headingColor">{hospital.licenseNumber}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    // Auto scroll or switch to doctors tab
                    setActiveTab("doctors");
                    const el = document.getElementById("doctors-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full btn rounded-2xl py-3 text-xs font-bold transition-all shadow-md shadow-teal-600/10 flex justify-center items-center gap-1.5"
                >
                  <FaUserMd /> Browse Doctors for Appointment
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- PREMIUM BOOKING WIZARD MODAL --- */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[500px] border border-gray-100 overflow-hidden flex flex-col justify-between max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800 flex-shrink-0">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-primaryColor">Appointment Scheduler</span>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 mt-0.5">
                  <FaHospital /> Booking with {selectedDoctor.name}
                </h3>
              </div>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Body / Scrollable */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              {/* Wizard Steps indicator */}
              <div className="flex gap-2 justify-center pb-2 border-b">
                {[1, 2].map(step => (
                  <span 
                    key={step} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      bookingStep === step ? "bg-primaryColor w-8" : "bg-gray-200 w-4"
                    }`} 
                  />
                ))}
              </div>

              {/* Step 1: Select Date & Time Slot */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border p-3 rounded-2xl text-xs text-textColor flex items-center gap-2">
                    <BiUserPin size={16} className="text-primaryColor" />
                    <div>
                      <p className="font-bold text-headingColor">{selectedDoctor.name}</p>
                      <p className="text-[10px] text-textColor mt-0.5">
                        {selectedDoctor.specialization} • Offline: <strong>₹{selectedDoctor.offlinePrice} INR</strong>
                        {selectedDoctor.isTelemedicine && selectedDoctor.onlinePrice !== null && (
                          <> | Online: <strong>₹{selectedDoctor.onlinePrice} INR</strong></>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Choose Date */}
                  <div>
                    <label className="text-xs font-extrabold text-headingColor block mb-1.5 uppercase tracking-wide">
                      Select Date *
                    </label>
                    <div className="relative">
                      <input 
                        type="date"
                        min={todayStr}
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor font-medium bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Select Slot */}
                  <div>
                    <label className="text-xs font-extrabold text-headingColor block mb-1.5 uppercase tracking-wide">
                      Select Available Slot *
                    </label>
                    <select
                      value={selectedSlotIndex}
                      onChange={e => setSelectedSlotIndex(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor bg-white"
                      required
                    >
                      <option value="">Choose a slot</option>
                      {selectedDoctor.timeSlots?.map((slot, index) => (
                        <option key={index} value={index}>
                          {slot.day}: {slot.startingTime} - {slot.endingTime}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={!selectedDate || selectedSlotIndex === ""}
                    onClick={() => setBookingStep(2)}
                    className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/10 disabled:opacity-50"
                  >
                    Proceed to Consultation Mode <FaArrowRight size={10} />
                  </button>
                </div>
              )}

              {/* Step 2: Consultation Mode & Symptoms */}
              {bookingStep === 2 && (
                <div className="space-y-4">
                  {/* Choose Mode */}
                  <div>
                    <label className="text-xs font-extrabold text-headingColor block mb-2 uppercase tracking-wide">
                      Consultation Mode *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setConsultationType("physical")}
                        className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                          consultationType === "physical"
                            ? "border-primaryColor bg-teal-50/20 text-primaryColor font-extrabold shadow-sm"
                            : "border-gray-200 hover:bg-gray-50 text-textColor"
                        }`}
                      >
                        <span className="text-lg">🏥</span>
                        <span className="text-xs">In-Person Visit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConsultationType("video-instant")}
                        className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                          consultationType === "video-instant"
                            ? "border-primaryColor bg-teal-50/20 text-primaryColor font-extrabold shadow-sm"
                            : "border-gray-200 hover:bg-gray-50 text-textColor"
                        }`}
                      >
                        <span className="text-lg">🎥</span>
                        <span className="text-xs">Video Consultation</span>
                      </button>
                    </div>
                  </div>

                  {/* Describe Symptoms */}
                  <div>
                    <label className="text-xs font-extrabold text-headingColor block mb-1.5 uppercase tracking-wide">
                      Symptoms / Health Notes
                    </label>
                    <textarea
                      placeholder="Describe what you are feeling briefly..."
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-gray-50 focus:outline-none focus:border-primaryColor text-textColor resize-none leading-relaxed"
                    />
                  </div>

                  <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 text-center mt-3">
                    <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Estimated Amount Due</p>
                    <p className="text-xl font-extrabold text-headingColor mt-0.5">
                      ₹{consultationType === "physical" 
                        ? selectedDoctor.offlinePrice 
                        : (selectedDoctor.onlinePrice || selectedDoctor.offlinePrice)
                      } INR
                    </p>
                    <p className="text-[9px] text-textColor mt-0.5">
                      Mode: {consultationType === "physical" ? "In-Person Consultation" : "Online Video Consultation"}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-xs font-bold text-textColor hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleBookingSubmit}
                      disabled={bookingLoading}
                      className="flex-1 bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/10"
                    >
                      {bookingLoading ? <Loader /> : <><FaLock size={10} /> Pay & Confirm</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
