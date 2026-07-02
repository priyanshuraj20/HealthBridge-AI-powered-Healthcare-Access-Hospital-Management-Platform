import { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authContext } from "../../context/AuthContext.jsx";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { FaVideo, FaNotesMedical, FaRobot, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const VideoCall = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { token, user, role } = useContext(authContext);
  const jitsiApiRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [aiSummary, setAiSummary] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Fetch Booking Details
  const fetchBooking = async () => {
    try {
      const res = await fetch(`${BASE_URL}/bookings/single/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setBooking(json.data);
        setNotes(json.data.doctorNotes || "");
        if (json.data.aiSummary && json.data.aiSummary.diagnosis) {
          setAiSummary(json.data.aiSummary);
        }
      } else {
        toast.error("Failed to load consultation details");
      }
    } catch (e) {
      toast.error("Network error loading details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Load Jitsi script and initialize
  useEffect(() => {
    if (!booking || !booking.meetingRoom) return;

    const scriptId = "jitsi-external-api-script";
    let script = document.getElementById(scriptId);

    const initJitsi = () => {
      const container = document.querySelector("#jitsi-container");
      if (container) {
        container.innerHTML = "";
      }

      const domain = "meet.jit.si";
      const options = {
        roomName: booking.meetingRoom,
        width: "100%",
        height: "100%",
        parentNode: container,
        userInfo: {
          displayName: user?.name || "Participant",
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TILE_VIEW_MAX_COLUMNS: 2,
        }
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => {
        initJitsi();
      };
      document.body.appendChild(script);
    } else {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
      } else {
        script.onload = () => {
          initJitsi();
        };
      }
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [booking]);

  const handleGenerateSummary = async () => {
    if (!notes.trim()) {
      toast.warning("Please write consultation notes first.");
      return;
    }

    setGeneratingSummary(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/ai-summary/${bookingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ doctorNotes: notes })
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("AI consultation summary generated!");
        setAiSummary(json.data.aiSummary);
      } else {
        toast.error(json.message || "Failed to generate summary");
      }
    } catch (e) {
      toast.error("Error communicating with AI services");
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <HashLoader color="#0d9488" />
      </div>
    );
  }

  return (
    <div className="container max-w-[1280px] mx-auto px-4 py-8">
      {/* Header Info */}
      <div className="bg-white border rounded-2xl p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <span className="bg-teal-50 border border-teal-200 text-[#0d9488] text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit mb-2">
            <FaVideo /> Live Video Consultation
          </span>
          <h2 className="text-xl font-extrabold text-headingColor">
            {booking?.consultationType === "video-followup"
              ? "Free Lab Report Follow-up"
              : booking?.consultationType === "video-instant"
              ? "Instant Consultation"
              : "Video Consultation"}
          </h2>
          <p className="text-xs text-textColor mt-1">
            Room Name: <span className="font-mono font-bold">{booking?.meetingRoom}</span>
          </p>
        </div>
        <button
          onClick={() => {
            if (role === "doctor") {
              navigate("/doctors/profile/me");
            } else {
              navigate("/users/profile/me");
            }
          }}
          className="border border-gray-300 hover:bg-gray-50 text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
        >
          Exit Consultation Room
        </button>
      </div>

      {/* Main Split Interface */}
      <div className="grid lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div
            id="jitsi-container"
            className="w-full h-[550px] rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-slate-900"
          >
            {/* The call window iframe will mount here dynamically */}
          </div>
          <p className="text-[11px] text-textColor italic text-center">
            Ensure webcam and microphone permission are authorized in your browser tabs.
          </p>
        </div>

        {/* Right Side */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Doctor clinical scribe panel */}
          {role === "doctor" && (
            <div className="bg-white border rounded-2xl p-5.5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-headingColor border-b pb-3">
                <FaNotesMedical className="text-primaryColor" />
                <span>Clinical Notes Scribe</span>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="Enter symptoms, observations, medicines to prescribe, and instructions..."
                className="w-full p-3 border rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor leading-5"
              />

              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="w-full btn rounded-xl py-3 text-xs font-bold flex justify-center items-center gap-2"
              >
                {generatingSummary ? (
                  <HashLoader size={16} color="#fff" />
                ) : (
                  <>
                    <FaRobot /> Generate AI Visit Summary
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI summaries dashboard */}
          <div className="bg-white border rounded-2xl p-5.5 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-headingColor border-b pb-3">
              <FaRobot className="text-[#0d9488]" />
              <span>AI Consultation Summary</span>
            </div>

            {aiSummary ? (
              <div className="space-y-4 text-xs">
                <div className="bg-teal-50/50 border border-teal-150 rounded-xl p-3.5 space-y-1">
                  <span className="font-extrabold text-[#0d9488] uppercase text-[9px] tracking-wider block">Diagnosis</span>
                  <p className="text-headingColor leading-5 font-semibold">{aiSummary.diagnosis}</p>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-3.5 space-y-1">
                  <span className="font-extrabold text-indigo-700 uppercase text-[9px] tracking-wider block">Symptoms</span>
                  <p className="text-headingColor leading-5">{aiSummary.symptoms}</p>
                </div>

                <div className="bg-green-50/50 border border-green-150 rounded-xl p-3.5 space-y-1">
                  <span className="font-extrabold text-green-700 uppercase text-[9px] tracking-wider block">Medications</span>
                  <p className="text-headingColor leading-5 whitespace-pre-line font-medium">{aiSummary.medications}</p>
                </div>

                {aiSummary.tests && (
                  <div className="bg-orange-50/50 border border-orange-150 rounded-xl p-3.5 space-y-1">
                    <span className="font-extrabold text-orange-700 uppercase text-[9px] tracking-wider block">Prescribed Tests</span>
                    <p className="text-headingColor leading-5">{aiSummary.tests}</p>
                  </div>
                )}

                <div className="bg-purple-50/50 border border-purple-150 rounded-xl p-3.5 space-y-1">
                  <span className="font-extrabold text-purple-700 uppercase text-[9px] tracking-wider block">Reminders</span>
                  <p className="text-headingColor leading-5">{aiSummary.reminders}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="text-yellow-650 bg-yellow-50 border border-yellow-200 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-lg">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <p className="text-xs text-headingColor font-bold">No Summary Available</p>
                  <p className="text-[10px] text-textColor mt-1 leading-4">
                    {role === "doctor"
                      ? "Write clinical notes above and click generate summary to activate AI details."
                      : "The AI summary will appear here once the doctor submits the consultation record."}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default VideoCall;
