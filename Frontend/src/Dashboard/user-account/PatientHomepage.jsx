import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config.js";
import { 
  BiCalendarEvent, BiBell, BiShield, BiFile, BiMap, 
  BiHealth, BiCheckCircle, BiChevronRight 
} from "react-icons/bi";
import { FaHospital, FaNotesMedical, FaStethoscope, FaDollarSign } from "react-icons/fa";
import convertTime from "../../utils/convertTime";

export default function PatientHomepage({ user, setTab }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // 1. Get user geolocation on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  // Fetch patient bookings and hospitals
  useEffect(() => {
    const fetchBookings = async () => {
      setLoadingBookings(true);
      try {
        const res = await fetch(`${BASE_URL}/users/appointments/my-appointments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const json = await res.json();
        if (res.ok) {
          setBookings(json.data || []);
        }
      } catch (e) {
        console.log("Error loading bookings:", e.message);
      } finally {
        setLoadingBookings(false);
      }
    };

    const fetchHospitals = async () => {
      try {
        const res = await fetch(`${BASE_URL}/hospitals`);
        const json = await res.json();
        if (res.ok) {
          const CITY_COORDS = {
            delhi: { lat: 28.7041, lng: 77.1025 },
            mumbai: { lat: 19.0760, lng: 72.8777 },
            bangalore: { lat: 12.9716, lng: 77.5946 },
            bengaluru: { lat: 12.9716, lng: 77.5946 },
            chennai: { lat: 13.0827, lng: 80.2707 },
            kolkata: { lat: 22.5726, lng: 88.3639 },
            hyderabad: { lat: 17.3850, lng: 78.4867 },
            pune: { lat: 18.5204, lng: 73.8567 },
            ahmedabad: { lat: 23.0225, lng: 72.5714 },
            "new york": { lat: 40.7128, lng: -74.0060 },
            london: { lat: 51.5074, lng: -0.1278 },
            dubai: { lat: 25.2048, lng: 55.2708 },
            toronto: { lat: 43.6532, lng: -79.3832 },
            singapore: { lat: 1.3521, lng: 103.8198 },
            sydney: { lat: -33.8688, lng: 151.2093 },
          };

          const getHaversine = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
          };

          // Compute dynamic distance
          const processedList = (json.data || []).map(h => {
            let finalDist = h.distance;
            if (userLocation) {
              const cityKey = (h.city || "").toLowerCase().trim();
              const coords = CITY_COORDS[cityKey];
              if (coords) {
                finalDist = parseFloat(getHaversine(userLocation.lat, userLocation.lng, coords.lat, coords.lng).toFixed(1));
              }
            }
            return { ...h, distance: finalDist };
          });

          // Sort by computed distance and pick top 3
          const sorted = processedList.sort((a, b) => a.distance - b.distance);
          setHospitals(sorted.slice(0, 3));
        }
      } catch (e) {}
    };

    fetchBookings();
    fetchHospitals();
  }, [userLocation]);

  const upcomingBooking = bookings.find(b => b.status === "confirmed" || b.status === "approved" || b.status === "pending");
  const completedBookings = bookings.filter(b => b.status === "completed");

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-[500px] space-y-2">
          <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full backdrop-blur-sm">
            HealthBridge Patient Workspace
          </span>
          <h2 className="text-2xl font-extrabold">Welcome back, {user?.name}!</h2>
          <p className="text-xs text-teal-100/90 leading-relaxed">
            Monitor appointments, search cashless insurance networks, scan prescription doses, and triage your symptoms instantly.
          </p>
        </div>
        
        {/* Abstract shape */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-12" />
      </div>

      {/* Grid: Left Summary & Reminders, Right Main content */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 8 columns */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150 space-y-3.5">
            <h4 className="text-xs font-bold text-headingColor uppercase tracking-wider">Quick Operations</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <button 
                onClick={() => setTab("symptoms")}
                className="bg-teal-50/40 hover:bg-teal-50 border hover:border-primaryColor/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all text-center"
              >
                <span className="text-xl">🩺</span>
                <span className="text-[10px] font-bold text-headingColor leading-none">Symptom Checker</span>
              </button>
              <button 
                onClick={() => navigate("/affordability")}
                className="bg-indigo-50/40 hover:bg-indigo-50 border hover:border-indigo-600/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all text-center"
              >
                <span className="text-xl">💰</span>
                <span className="text-[10px] font-bold text-headingColor leading-none">Compare Costs</span>
              </button>
              <button 
                onClick={() => navigate("/doctors")}
                className="bg-amber-50/40 hover:bg-amber-50 border hover:border-amber-600/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all text-center"
              >
                <span className="text-xl">🏥</span>
                <span className="text-[10px] font-bold text-headingColor leading-none">Find Hospitals</span>
              </button>
              <button 
                onClick={() => setTab("bookings")}
                className="bg-rose-50/40 hover:bg-rose-50 border hover:border-rose-600/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all text-center"
              >
                <span className="text-xl">📋</span>
                <span className="text-[10px] font-bold text-headingColor leading-none">Appointments</span>
              </button>
              <button 
                onClick={() => setTab("prescription-ocr")}
                className="bg-purple-50/40 hover:bg-purple-50 border hover:border-purple-600/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all text-center"
              >
                <span className="text-xl">📷</span>
                <span className="text-[10px] font-bold text-headingColor leading-none">Scan Rx</span>
              </button>
              <button 
                onClick={() => setTab("family")}
                className="bg-emerald-50/40 hover:bg-emerald-50 border hover:border-emerald-600/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all text-center"
              >
                <span className="text-xl">👨‍👩‍👧</span>
                <span className="text-[10px] font-bold text-headingColor leading-none">Family Vault</span>
              </button>
            </div>
          </div>

          {/* Upcoming Appointment Alert */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold text-headingColor uppercase tracking-wider flex items-center gap-1.5">
                <BiCalendarEvent className="text-primaryColor" size={16} /> Upcoming Consultations
              </span>
              <button onClick={() => setTab("bookings")} className="text-primaryColor text-[10px] font-bold hover:underline flex items-center">
                All Bookings <BiChevronRight />
              </button>
            </div>

            {upcomingBooking ? (
              <div className="bg-gray-50 border rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-primaryColor font-bold">
                    {upcomingBooking.doctor?.name?.[0] || "Dr"}
                  </div>
                  <div>
                    <h5 className="font-bold text-headingColor text-xs">Dr. {upcomingBooking.doctor?.name}</h5>
                    <p className="text-[10px] text-textColor mt-0.5">{upcomingBooking.doctor?.specialization}</p>
                    <p className="text-[9px] text-gray-400 mt-1 font-mono">
                      📅 {upcomingBooking.appointmentDate} at {upcomingBooking.timeSlot ? convertTime(upcomingBooking.timeSlot.startingTime) : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="bg-teal-50 border border-teal-200 text-teal-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded block text-center mb-2">
                    {upcomingBooking.status}
                  </span>
                  {(upcomingBooking.consultationType === "video-followup" || upcomingBooking.consultationType === "video-instant") && (upcomingBooking.status === "confirmed" || upcomingBooking.status === "approved" || upcomingBooking.status === "pending") && (
                    <button 
                      onClick={() => navigate(`/video-call/${upcomingBooking.id}`)}
                      className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm"
                    >
                      Join Call
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-textColor italic py-2">No upcoming consultation slots scheduled.</p>
            )}
          </div>

          {/* Affordable Hospitals Near Me */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150 space-y-4">
            <h4 className="text-xs font-bold text-headingColor uppercase tracking-wider">Affordable Partner Hospitals Near Me</h4>
            <div className="grid md:grid-cols-3 gap-4">
               {hospitals.map((h) => (
                <div 
                  key={h.id} 
                  onClick={() => navigate(`/doctors/${h.id}`)}
                  className="border rounded-2xl p-4 bg-gray-50 hover:bg-white hover:border-primaryColor/30 transition-all cursor-pointer space-y-2 shadow-sm"
                >
                  <span className="bg-amber-400 text-slate-900 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">
                    ⭐ {h.rating}
                  </span>
                  <h5 className="font-bold text-headingColor text-xs truncate mt-1">{h.name}</h5>
                  <p className="text-[10px] text-textColor truncate">📍 {h.address || h.location}</p>
                  <p className="text-[9px] text-primaryColor font-extrabold mt-2">📍 {h.distance} km away • {h.waitingTime} min wait</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 4 columns - Widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Health Summary Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150 space-y-4">
            <h4 className="text-xs font-bold text-headingColor uppercase tracking-wider">My Health Profile</h4>
            <div className="space-y-2.5 text-xs text-textColor">
              <div className="flex justify-between border-b pb-1.5">
                <span className="font-semibold text-headingColor">Blood Group:</span>
                <span>{user?.bloodGroup || "O+"}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="font-semibold text-headingColor">Gender:</span>
                <span className="capitalize">{user?.gender || "Male"}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="font-semibold text-headingColor">Emergency Contact:</span>
                <span>{user?.emergencyContact?.name || "Self (Family)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-headingColor">Contact Phone:</span>
                <span>{user?.emergencyContact?.phone || user?.phone || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Medical reminders widget */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150 space-y-4">
            <div className="flex items-center gap-1.5 border-b pb-3">
              <BiBell className="text-rose-500" size={16} />
              <h4 className="text-xs font-bold text-headingColor uppercase tracking-wider">Dosage Reminders</h4>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5 p-2 bg-rose-50/50 border border-rose-100 rounded-xl">
                <span className="text-base">💊</span>
                <div>
                  <p className="font-bold text-headingColor text-[11px]">Paracetamol 650mg</p>
                  <p className="text-[9px] text-textColor mt-0.5">Post-Meal • 2 times a day</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <span className="text-base">💧</span>
                <div>
                  <p className="font-bold text-headingColor text-[11px]">Hydration Alarm</p>
                  <p className="text-[9px] text-textColor mt-0.5">Every 2 hours • 8 times a day</p>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance box */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150 space-y-4">
            <div className="flex items-center gap-1.5 border-b pb-3">
              <BiShield className="text-primaryColor" size={16} />
              <h4 className="text-xs font-bold text-headingColor uppercase tracking-wider">Cashless Insurance</h4>
            </div>
            
            <div className="bg-teal-50/40 border border-teal-150 rounded-2xl p-4 space-y-2 text-xs">
              <p className="font-extrabold text-teal-800 text-[10px] uppercase">Active Plan</p>
              <p className="font-bold text-headingColor">National Cashless Triage (PM-JAY)</p>
              <p className="text-textColor leading-relaxed mt-1 text-[10px]">Status: Verified Cashless Hospital Network cover active.</p>
            </div>
          </div>

          {/* AI Coordinator chat box shortcut */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md border border-slate-800 space-y-3">
            <span className="bg-white/10 text-primaryColor text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full backdrop-blur-sm w-fit block">
              🤖 HealthBridge AI Coordinator
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Describe symptoms in plain language to get triage suggestions and department recommendations.
            </p>
            <button 
              onClick={() => setTab("symptoms")}
              className="w-full bg-primaryColor hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
            >
              Start AI Symptom Check <BiChevronRight />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
