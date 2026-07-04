import { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authContext } from "../../context/AuthContext.jsx";
import { BASE_URL } from "../../config.js";
import { 
  BiVideo, BiCalendar, BiTime, BiUser, BiChevronRight, 
  BiCheckCircle, BiHelpCircle, BiPhoneCall, BiPulse, BiX 
} from "react-icons/bi";
import { FaUserMd, FaShieldAlt, FaRegClock, FaLaptopMedical } from "react-icons/fa";
import HashLoader from "react-spinners/HashLoader";
import { toast } from "react-toastify";
import convertTime from "../../utils/convertTime.js";

export default function TelemedicineRedirect() {
  const navigate = useNavigate();
  const { token, role, user } = useContext(authContext);
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Instant matching states
  const [matchingModal, setMatchingModal] = useState(false);
  const [matchingStep, setMatchingStep] = useState(0);
  const [symptomInput, setSymptomInput] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [matchLoading, setMatchLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const endpoint = role === "doctor" 
        ? `${BASE_URL}/doctors/profile/me` 
        : `${BASE_URL}/users/appointments/my-appointments`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      
      if (res.ok) {
        if (role === "doctor") {
          setAppointments(json.data?.appointments || []);
        } else {
          setAppointments(json.data || []);
        }
      }
    } catch (e) {
      toast.error("Failed to load telemedicine appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchAppointments();
  }, [token, role, navigate]);

  const handleInstantMatchSubmit = async (e) => {
    e.preventDefault();
    if (!symptomInput.trim()) {
      toast.error("Please describe your symptoms briefly.");
      return;
    }

    setMatchLoading(true);
    setMatchingStep(1); // "Checking doctor availability..."

    // Animate matching steps for premium user experience
    setTimeout(() => setMatchingStep(2), 1200); // "Establishing secure VideoSDK channel..."
    setTimeout(() => setMatchingStep(3), 2400); // "Routing to closest partner branch..."

    try {
      // Execute the matching request to backend after animation finishes
      setTimeout(async () => {
        try {
          const res = await fetch(`${BASE_URL}/bookings/book-instant`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              symptoms: symptomInput.trim(),
              specialty: selectedSpec
            })
          });
          const json = await res.json();

          if (res.ok && json.data) {
            toast.success("Doctor matched! Connecting video room...");
            navigate(`/video-call/${json.data.id}`);
          } else {
            toast.error(json.message || "Failed to find available telemedicine doctor.");
            setMatchingModal(false);
            setMatchLoading(false);
          }
        } catch (err) {
          toast.error("Match connection timeout. Try again.");
          setMatchingModal(false);
          setMatchLoading(false);
        }
      }, 3500);

    } catch (err) {
      setMatchingModal(false);
      setMatchLoading(false);
    }
  };

  const triggerMatchFlow = (spec) => {
    setSelectedSpec(spec);
    setSymptomInput("");
    setMatchingStep(0);
    setMatchingModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <HashLoader color="#0d9488" size={50} />
        <p className="text-sm font-semibold text-textColor">
          Loading Telemedicine Hub...
        </p>
      </div>
    );
  }

  // Filter video consultations
  const videoConsults = appointments.filter(app => {
    const isVideo = app.consultationType === "video-instant" || app.consultationType === "video-followup" || app.mode === "online";
    const isPendingOrActive = app.status === "confirmed" || app.status === "approved" || app.status === "pending";
    return isVideo && isPendingOrActive;
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-16 relative">
      {/* Premium Hero Banner */}
      <section className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white py-12 px-6 shadow-md relative overflow-hidden">
        <div className="container max-w-[1200px] mx-auto grid md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-4">
            <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-3.5 py-1.5 rounded-full backdrop-blur-sm tracking-wider">
              Secure Video Telehealth Rooms
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Virtual Doctor Consultations, Right from Home
            </h1>
            <p className="text-teal-100 text-xs md:text-sm max-w-lg leading-relaxed">
              Connect securely with verified specialist doctors using our HD video conferencing tool. Safe, encrypted, and HIPAA-compliant.
            </p>
          </div>
          <div className="hidden md:flex justify-end">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl w-80 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-200">
                  <FaShieldAlt size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Fully Encrypted Call</h4>
                  <p className="text-[10px] text-teal-200">Secure end-to-end connection</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-200">
                  <FaLaptopMedical size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">AI Clinical Summary</h4>
                  <p className="text-[10px] text-cyan-200">Auto-extracted prescriptions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-24" />
      </section>

      {/* Main Content Hub */}
      <main className="container max-w-[1200px] mx-auto px-4 mt-10">
        
        {/* EMERGENCY INSTANT CONNECT BANNER */}
        {role === "patient" && (
          <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="text-[10px] font-extrabold uppercase bg-white/25 px-2.5 py-0.5 rounded-full tracking-wider">Emergency / High Fever Consult</span>
              </div>
              <h3 className="text-lg md:text-xl font-extrabold">Need to see a doctor immediately?</h3>
              <p className="text-xs text-rose-100 max-w-xl">
                Skip the lines. Get matched instantly with any available approved telemedicine practitioner for emergency triage or prescriptions.
              </p>
            </div>
            <button
              onClick={() => triggerMatchFlow("General Physician")}
              className="bg-white hover:bg-rose-50 text-rose-600 font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md transition-all whitespace-nowrap flex items-center gap-2"
            >
              <BiPhoneCall size={16} className="animate-bounce" /> Connect Video Call Now
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left panel: Active Call Rooms list */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-150">
              <h2 className="text-lg font-extrabold text-headingColor flex items-center gap-2 border-b pb-4 mb-5">
                <BiVideo className="text-primaryColor" size={24} /> 
                Active & Upcoming Video Consultations
              </h2>

              {videoConsults.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-primaryColor">
                    <BiPhoneCall size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-headingColor text-sm">No Active Video Consults</h3>
                    <p className="text-textColor text-xs max-w-sm mx-auto leading-relaxed">
                      You don't have any video consultation rooms scheduled at the moment. Browse clinical branches or launch an instant consultation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {videoConsults.map((app) => {
                    const targetUser = role === "doctor" ? app.patient : app.doctor;
                    const name = targetUser?.name || "Practitioner";
                    const subtitle = role === "doctor" ? "Patient Record" : targetUser?.specialization;
                    const photo = targetUser?.photoUrl || targetUser?.user?.photo || "";
                    
                    return (
                      <div 
                        key={app.id} 
                        className="border border-gray-150 rounded-2xl p-5 hover:border-primaryColor/30 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50"
                      >
                        <div className="flex gap-4">
                          <figure className="w-14 h-14 rounded-full overflow-hidden border-2 border-primaryColor/20 flex-shrink-0 bg-white">
                            <img 
                              src={photo || "https://res.cloudinary.com/dnb4jcioy/image/upload/v1782951551/famous_doctor_portrait.jpg"} 
                              alt={name} 
                              className="w-full h-full object-cover" 
                            />
                          </figure>
                          <div className="space-y-1">
                            <span className="bg-primaryColor/10 text-primaryColor font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                              {app.consultationType === "video-instant" ? "Instant Video" : "Follow-Up Video"}
                            </span>
                            <h4 className="font-extrabold text-headingColor text-sm">
                              {role === "doctor" ? "" : "Dr. "}{name}
                            </h4>
                            <p className="text-[11px] text-textColor font-medium">{subtitle}</p>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium font-mono pt-1">
                              <span className="flex items-center gap-1">
                                <BiCalendar size={12} /> {app.appointmentDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <BiTime size={12} /> {app.timeSlot ? convertTime(app.timeSlot.startingTime) : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-stretch sm:items-end gap-2.5 w-full sm:w-auto">
                          <span className="bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-extrabold px-3 py-1 rounded-full text-center">
                            ✅ Approved & Ready
                          </span>
                          <button
                            onClick={() => navigate(`/video-call/${app.id}`)}
                            className="bg-primaryColor hover:bg-teal-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 w-full sm:w-auto"
                          >
                            <BiPulse className="animate-pulse" /> Join Video Room
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Specialties & Telehealth FAQs */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Specialties */}
            {role === "patient" && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 space-y-4">
                <div>
                  <h3 className="font-extrabold text-headingColor text-sm uppercase tracking-wider">Instant Video Specialties</h3>
                  <p className="text-[10px] text-textColor mt-0.5">Choose a specialization to connect instantly.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { spec: "General Physician", icon: "🩺" },
                    { spec: "Pediatrics", icon: "👶" },
                    { spec: "Dermatology", icon: "🧴" },
                    { spec: "Cardiology", icon: "❤️" }
                  ].map((x) => (
                    <button
                      key={x.spec}
                      onClick={() => triggerMatchFlow(x.spec)}
                      className="border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primaryColor/20 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">{x.icon}</span>
                      <span className="text-[10px] font-bold text-headingColor">{x.spec}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick FAQs */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 space-y-4">
              <h3 className="font-extrabold text-headingColor text-sm uppercase tracking-wider flex items-center gap-1.5">
                <BiHelpCircle className="text-primaryColor" /> Telehealth FAQs
              </h3>
              
              <div className="space-y-3.5 text-xs text-textColor">
                <div className="space-y-1">
                  <h4 className="font-bold text-headingColor">How do I join my call?</h4>
                  <p className="leading-relaxed">Click the "Join Video Room" button on this page. Make sure to allow microphone and camera access.</p>
                </div>
                <div className="space-y-1 border-t pt-3">
                  <h4 className="font-bold text-headingColor">Is my data secure?</h4>
                  <p className="leading-relaxed">Yes, all calls run on an encrypted peer-to-peer network via VideoSDK. No clinical audio/video is recorded.</p>
                </div>
                <div className="space-y-1 border-t pt-3">
                  <h4 className="font-bold text-headingColor">Can I get prescriptions?</h4>
                  <p className="leading-relaxed">Yes, during the call, the doctor can send digital prescriptions directly to your patient records.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* INSTANT MATCHING MODAL */}
      {matchingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-gray-100 relative">
            <button
              onClick={() => !matchLoading && setMatchingModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-headingColor transition-all"
            >
              <BiX size={24} />
            </button>

            {!matchLoading ? (
              <form onSubmit={handleInstantMatchSubmit} className="space-y-4">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-primaryColor">
                    <BiVideo size={24} />
                  </div>
                  <h3 className="font-extrabold text-headingColor text-base">Match Instant Triage Consultation</h3>
                  <p className="text-xs text-textColor max-w-[280px] mx-auto leading-relaxed">
                    Connect instantly with a {selectedSpec} from the HealthBridge hospital network.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-textColor">Explain your symptoms briefly *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="E.g. High fever since last night, severe throat pain..."
                    className="w-full bg-gray-50 border rounded-2xl p-3 text-xs focus:outline-none focus:border-primaryColor text-textColor"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primaryColor hover:bg-teal-700 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  Find Available Doctor
                </button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-6">
                <div className="flex justify-center">
                  <HashLoader color="#0d9488" size={40} />
                </div>
                
                <div className="space-y-3.5 max-w-[300px] mx-auto text-left">
                  <h4 className="font-extrabold text-headingColor text-sm text-center">Establishing Secure Link...</h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${matchingStep >= 1 ? "bg-teal-500 text-white" : "bg-gray-100 text-textColor"}`}>
                        {matchingStep > 1 ? "✓" : "1"}
                      </span>
                      <span className={`${matchingStep >= 1 ? "font-bold text-headingColor" : "text-textColor"}`}>Checking doctor availability...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${matchingStep >= 2 ? "bg-teal-500 text-white" : "bg-gray-100 text-textColor"}`}>
                        {matchingStep > 2 ? "✓" : "2"}
                      </span>
                      <span className={`${matchingStep >= 2 ? "font-bold text-headingColor" : "text-textColor"}`}>Establishing secure VideoSDK channel...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${matchingStep >= 3 ? "bg-teal-500 text-white" : "bg-gray-100 text-textColor"}`}>
                        {matchingStep > 3 ? "✓" : "3"}
                      </span>
                      <span className={`${matchingStep >= 3 ? "font-bold text-headingColor" : "text-textColor"}`}>Routing to closest partner branch...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
