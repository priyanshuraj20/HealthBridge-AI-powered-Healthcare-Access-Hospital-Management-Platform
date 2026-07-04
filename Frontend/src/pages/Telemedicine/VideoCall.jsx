import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authContext } from "../../context/AuthContext.jsx";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import {
  MeetingProvider,
  MeetingConsumer,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import {
  FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash,
  FaDesktop, FaComment, FaPhoneSlash, FaStopCircle,
  FaNotesMedical, FaRobot, FaCheckCircle, FaExclamationTriangle,
  FaTimes, FaUpload, FaFilePrescription
} from "react-icons/fa";

// ─── Individual Participant Video Tile ───────────────────────────────────────
const ParticipantView = ({ participantId }) => {
  const micRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } =
    useParticipant(participantId);

  const videoStream = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current && micOn && micStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);
      micRef.current.srcObject = mediaStream;
      micRef.current.play().catch(() => {});
    }
  }, [micStream, micOn]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 aspect-video flex items-center justify-center">
      <audio ref={micRef} autoPlay muted={isLocal} />
      {webcamOn ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center text-white text-2xl font-bold">
            {displayName?.[0]?.toUpperCase() || "?"}
          </div>
          <p className="text-slate-400 text-xs font-medium">{displayName}</p>
          <p className="text-slate-500 text-[10px]">Camera Off</p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
        {micOn
          ? <FaMicrophone className="text-green-400" size={10} />
          : <FaMicrophoneSlash className="text-red-400" size={10} />}
        <span className="text-white text-[10px] font-medium">
          {isLocal ? "You" : displayName}
        </span>
      </div>
    </div>
  );
};

// ─── Meeting Controls Bar ────────────────────────────────────────────────────
const ControlsBar = ({ role, onEndConsultation, onLeave }) => {
  const { toggleMic, toggleWebcam, toggleScreenShare, localMicOn, localWebcamOn, leave, end } = useMeeting();
  const [screenSharing, setScreenSharing] = useState(false);

  const handleToggleScreen = () => {
    toggleScreenShare();
    setScreenSharing(p => !p);
  };

  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-700 flex-wrap">
      {/* Mic */}
      <button
        onClick={() => toggleMic()}
        title={localMicOn ? "Mute" : "Unmute"}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
          localMicOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600 hover:bg-red-500"
        }`}
      >
        {localMicOn ? <FaMicrophone size={16} /> : <FaMicrophoneSlash size={16} />}
      </button>

      {/* Camera */}
      <button
        onClick={() => toggleWebcam()}
        title={localWebcamOn ? "Camera Off" : "Camera On"}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
          localWebcamOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600 hover:bg-red-500"
        }`}
      >
        {localWebcamOn ? <FaVideo size={16} /> : <FaVideoSlash size={16} />}
      </button>

      {/* Screen Share */}
      <button
        onClick={handleToggleScreen}
        title={screenSharing ? "Stop Sharing" : "Share Screen"}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
          screenSharing ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-700 hover:bg-slate-600"
        }`}
      >
        <FaDesktop size={16} />
      </button>

      {/* Leave / End */}
      {role === "doctor" ? (
        <button
          onClick={onEndConsultation}
          title="End Consultation for Everyone"
          className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-2 transition-all shadow-lg"
        >
          <FaStopCircle size={14} /> End Consultation
        </button>
      ) : (
        <button
          onClick={onLeave}
          title="Leave Meeting"
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all shadow-lg"
        >
          <FaPhoneSlash size={16} />
        </button>
      )}
    </div>
  );
};

// ─── Participants Grid ────────────────────────────────────────────────────────
const ParticipantsGrid = () => {
  const { participants } = useMeeting();
  const participantList = [...participants.keys()];

  return (
    <div className={`grid gap-3 h-full ${participantList.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {participantList.map((id) => (
        <ParticipantView key={id} participantId={id} />
      ))}
      {participantList.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
            <FaVideo size={24} />
          </div>
          <p className="text-sm font-medium">Waiting for participants to join...</p>
          <p className="text-xs text-slate-500">Share the consultation link with the other participant</p>
        </div>
      )}
    </div>
  );
};

// ─── Meeting Timer ────────────────────────────────────────────────────────────
const MeetingTimer = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return (
    <span className="font-mono text-white text-sm font-bold bg-slate-800 px-3 py-1 rounded-full border border-slate-600">
      {h > 0 ? `${String(h).padStart(2, "0")}:` : ""}
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
};

// ─── Meeting Inner Component (has access to useMeeting hooks) ─────────────────
const MeetingRoom = ({ role, booking, bookingId, onEnd, notes, setNotes, aiSummary, setAiSummary, token }) => {
  const navigate = useNavigate();
  const { join, leave, end, participants } = useMeeting({
    onMeetingJoined: () => toast.success("Joined consultation room!"),
    onMeetingLeft: () => {
      toast.info("You have left the consultation.");
    },
    onError: (err) => toast.error(`Video error: ${err.message}`),
  });

  const [joined, setJoined] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", duration: "", instructions: "" }]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [savingPrescription, setSavingPrescription] = useState(false);

  useEffect(() => {
    // Auto-join when component mounts
    setTimeout(() => {
      join();
      setJoined(true);
    }, 500);
  }, []);

  const handleLeave = () => {
    leave();
    if (role === "patient") navigate("/users/profile/me");
    else navigate("/doctors/profile/me");
  };

  const handleEndConsultation = async () => {
    if (!window.confirm("End consultation for everyone? This will mark the appointment as completed.")) return;
    try {
      await fetch(`${BASE_URL}/bookings/meetings/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ appointmentId: bookingId }),
      });
      end();
      toast.success("Consultation ended. Appointment marked as completed.");
      setTimeout(() => navigate("/doctors/profile/me"), 1500);
    } catch (e) {
      toast.error("Failed to end consultation.");
    }
  };

  const handleGenerateSummary = async () => {
    if (!notes.trim()) { toast.warning("Write clinical notes first."); return; }
    setGeneratingSummary(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/ai-summary/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorNotes: notes }),
      });
      const json = await res.json();
      if (res.ok) { toast.success("AI summary generated!"); setAiSummary(json.data.aiSummary); }
      else toast.error(json.message);
    } catch { toast.error("AI summary generation failed."); }
    finally { setGeneratingSummary(false); }
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (medicines.some(m => !m.name || !m.dosage)) { toast.error("Fill in medicine name and dosage."); return; }
    setSavingPrescription(true);
    try {
      const res = await fetch(`${BASE_URL}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user: booking?.user?.id || booking?.patient?.userId || booking?.user?._id || booking?.patient?.id,
          booking: bookingId,
          medicines,
          notes: prescriptionNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Prescription saved and sent to patient!");
      setShowPrescription(false);
    } catch (err) { toast.error(err.message); }
    finally { setSavingPrescription(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-3 p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-slate-900 rounded-2xl px-5 py-3 border border-slate-700 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-white text-xs font-bold uppercase tracking-wider">Live Consultation</span>
          </div>
          <MeetingTimer />
          <span className="text-slate-400 text-xs">
            {participants.size} participant{participants.size !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {role === "doctor" && (
            <>
              <button
                onClick={() => setShowPrescription(p => !p)}
                className="flex items-center gap-1.5 text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-xl font-semibold transition-all"
              >
                <FaFilePrescription size={12} /> Prescription
              </button>
            </>
          )}
          <button
            onClick={() => setShowChat(p => !p)}
            className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-xl font-semibold transition-all"
          >
            <FaComment size={12} /> Chat
          </button>
          <button
            onClick={handleLeave}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 font-medium transition-all"
          >
            Exit Room
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-3 flex-1 overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 min-h-0 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden p-3">
          <ParticipantsGrid />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">
          {/* Chat Panel */}
          {showChat && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-64">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span className="text-xs font-bold text-headingColor flex items-center gap-1.5">
                  <FaComment className="text-primaryColor" size={11} /> Chat
                </span>
                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={12} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-gray-400 text-center mt-4">No messages yet</p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-xs p-2 rounded-xl max-w-[85%] ${msg.self ? "bg-teal-50 border border-teal-100 ml-auto text-right" : "bg-gray-50 border border-gray-100"}`}>
                    <p className="font-bold text-[10px] text-gray-500 mb-0.5">{msg.sender}</p>
                    <p className="text-headingColor">{msg.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100 flex gap-1.5">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && chatInput.trim()) {
                      setChatMessages(p => [...p, { text: chatInput, sender: "You", self: true }]);
                      setChatInput("");
                    }
                  }}
                  placeholder="Type message..."
                  className="flex-1 text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primaryColor"
                />
              </div>
            </div>
          )}

          {/* Doctor Clinical Notes */}
          {role === "doctor" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-headingColor border-b pb-2">
                <FaNotesMedical className="text-primaryColor" size={12} />
                <span>Clinical Notes</span>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={5}
                placeholder="Symptoms, observations, prescriptions..."
                className="w-full text-xs p-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-textColor leading-5 resize-none"
              />
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="w-full bg-primaryColor hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                {generatingSummary ? <HashLoader size={12} color="#fff" /> : <><FaRobot size={11} /> Generate AI Summary</>}
              </button>
            </div>
          )}

          {/* AI Summary Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-headingColor border-b pb-2">
              <FaRobot className="text-primaryColor" size={12} />
              <span>AI Consultation Summary</span>
            </div>
            {aiSummary?.diagnosis ? (
              <div className="space-y-2 text-xs">
                {[
                  { label: "Diagnosis", value: aiSummary.diagnosis, bg: "bg-teal-50 border-teal-200", tc: "text-teal-800" },
                  { label: "Medications", value: aiSummary.medications, bg: "bg-green-50 border-green-200", tc: "text-green-800" },
                  { label: "Reminders", value: aiSummary.reminders, bg: "bg-purple-50 border-purple-200", tc: "text-purple-800" },
                ].map(({ label, value, bg, tc }) => (
                  <div key={label} className={`${bg} border rounded-xl p-2.5`}>
                    <p className={`text-[9px] font-extrabold uppercase tracking-wider ${tc} mb-0.5`}>{label}</p>
                    <p className="text-headingColor leading-4 font-medium">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <FaExclamationTriangle className="text-amber-400 mx-auto" size={20} />
                <p className="text-xs text-gray-500 leading-4">
                  {role === "doctor"
                    ? "Write clinical notes and generate an AI summary above."
                    : "AI summary will appear once the doctor submits notes."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <ControlsBar
        role={role}
        onEndConsultation={handleEndConsultation}
        onLeave={handleLeave}
      />

      {/* Prescription Modal */}
      {showPrescription && role === "doctor" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-headingColor flex items-center gap-2">
                <FaFilePrescription className="text-primaryColor" /> Upload Prescription
              </h3>
              <button onClick={() => setShowPrescription(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handlePrescriptionSubmit} className="p-5 space-y-4">
              <p className="text-xs text-textColor">
                Patient: <strong>{booking?.user?.name}</strong>
              </p>
              {medicines.map((med, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
                  <input
                    placeholder="Medicine name *"
                    value={med.name}
                    onChange={e => setMedicines(m => m.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                    className="col-span-2 border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primaryColor"
                    required
                  />
                  <input
                    placeholder="Dosage * (e.g. 500mg)"
                    value={med.dosage}
                    onChange={e => setMedicines(m => m.map((x, i) => i === idx ? { ...x, dosage: e.target.value } : x))}
                    className="border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primaryColor"
                    required
                  />
                  <input
                    placeholder="Duration (e.g. 7 days)"
                    value={med.duration}
                    onChange={e => setMedicines(m => m.map((x, i) => i === idx ? { ...x, duration: e.target.value } : x))}
                    className="border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primaryColor"
                  />
                  <input
                    placeholder="Instructions (e.g. after meals)"
                    value={med.instructions}
                    onChange={e => setMedicines(m => m.map((x, i) => i === idx ? { ...x, instructions: e.target.value } : x))}
                    className="col-span-2 border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primaryColor"
                  />
                  {medicines.length > 1 && (
                    <button type="button" onClick={() => setMedicines(m => m.filter((_, i) => i !== idx))} className="col-span-2 text-red-500 text-[10px] font-semibold text-right hover:text-red-700">
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setMedicines(m => [...m, { name: "", dosage: "", duration: "", instructions: "" }])} className="text-xs text-primaryColor font-semibold hover:underline">
                + Add Medicine
              </button>
              <textarea
                placeholder="Additional notes (optional)"
                value={prescriptionNotes}
                onChange={e => setPrescriptionNotes(e.target.value)}
                rows={2}
                className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primaryColor text-textColor"
              />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowPrescription(false)} className="px-4 py-2 text-xs border rounded-xl text-textColor hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={savingPrescription} className="px-5 py-2 text-xs bg-primaryColor text-white rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center gap-1.5">
                  {savingPrescription ? <HashLoader size={12} color="#fff" /> : <><FaUpload size={10} /> Save & Send</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main VideoCall Component ─────────────────────────────────────────────────
const VideoCall = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { token, user, role } = useContext(authContext);

  const [booking, setBooking] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [aiSummary, setAiSummary] = useState(null);

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        // Fetch booking info
        const bookingRes = await fetch(`${BASE_URL}/bookings/single/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bookingJson = await bookingRes.json();
        if (!bookingRes.ok) { toast.error("Failed to load appointment."); return; }
        setBooking(bookingJson.data);
        setNotes(bookingJson.data.doctorNotes || "");
        if (bookingJson.data.aiSummary?.diagnosis) setAiSummary(bookingJson.data.aiSummary);

        // Get/create VideoSDK meeting
        const meetingRes = await fetch(`${BASE_URL}/bookings/meetings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meetingJson = await meetingRes.json();
        if (!meetingRes.ok) { toast.error("Failed to create video session."); return; }
        setMeeting(meetingJson.data);
      } catch (e) {
        toast.error("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    if (token && bookingId) fetchMeetingDetails();
  }, [bookingId, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <HashLoader color="#0d9488" size={50} />
        <p className="text-sm font-semibold text-textColor">Preparing your secure video consultation...</p>
        <p className="text-xs text-gray-400">Connecting to VideoSDK.live servers</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
          <FaVideoSlash className="text-red-500" size={24} />
        </div>
        <h3 className="text-lg font-bold text-headingColor">Failed to Load Consultation</h3>
        <p className="text-sm text-textColor max-w-sm">Could not connect to the video consultation room. Please try again.</p>
        <button
          onClick={() => navigate(role === "doctor" ? "/doctors/profile/me" : "/users/profile/me")}
          className="px-6 py-2.5 bg-primaryColor text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const participantToken = role === "doctor" ? meeting.hospitalToken : meeting.patientToken;
  const participantName = user?.name || (role === "doctor" ? "Doctor" : "Patient");

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="text-primaryColor font-extrabold text-lg">HealthBridge</div>
          <span className="text-slate-500 text-xs">|</span>
          <span className="text-slate-300 text-xs font-medium">
            {booking?.consultationType === "video-followup"
              ? "Free Follow-up Consultation"
              : booking?.consultationType === "video-instant"
              ? "Instant Consultation"
              : "Video Consultation"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-[10px] font-mono">Room: {meeting.roomId}</span>
          <span className="text-[10px] bg-green-900/50 border border-green-700 text-green-400 px-2 py-0.5 rounded-full font-semibold">
            🔒 Secure VideoSDK
          </span>
        </div>
      </div>

      {/* VideoSDK MeetingProvider */}
      <MeetingProvider
        config={{
          meetingId: meeting.roomId,
          micEnabled: true,
          webcamEnabled: true,
          name: participantName,
          participantId: role === "doctor"
            ? `doctor-${booking?.doctor?.id || bookingId}`
            : `patient-${booking?.patient?.id || bookingId}`,
          multiStream: false,
        }}
        token={participantToken}
        reinitialiseMeetingOnConfigChange={true}
        joinWithoutUserInteraction={false}
      >
        <MeetingRoom
          role={role}
          booking={booking}
          bookingId={bookingId}
          onEnd={() => navigate(role === "doctor" ? "/doctors/profile/me" : "/users/profile/me")}
          notes={notes}
          setNotes={setNotes}
          aiSummary={aiSummary}
          setAiSummary={setAiSummary}
          token={token}
        />
      </MeetingProvider>
    </div>
  );
};

export default VideoCall;
