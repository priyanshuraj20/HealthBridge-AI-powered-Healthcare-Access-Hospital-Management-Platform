import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetchData from "../../hooks/useFetchData";
import { BASE_URL } from "../../config";
import Loading from "../../components/Loader/Loading";
import Error from "../../components/Error/Error.jsx";
import { toast } from "react-toastify";
import convertTime from "../../utils/convertTime";
import { FaVideo, FaCloudUploadAlt, FaFileMedical } from "react-icons/fa";

const MyBookings = () => {
  const {
    data: bookings,
    loading,
    error,
    setData: setBookingsData,
  } = useFetchData(`${BASE_URL}/users/appointments/my-appointments`);

  const navigate = useNavigate();
  const [rescheduleData, setRescheduleData] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", slotIndex: "" });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const [aiSummaryData, setAiSummaryData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Telemedicine state
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportName, setReportName] = useState("");
  const [showReportUpload, setShowReportUpload] = useState(null);
  const [showFollowupForm, setShowFollowupForm] = useState(null);
  const [followupDate, setFollowupDate] = useState("");
  const [followupSlotIndex, setFollowupSlotIndex] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await fetch(`${BASE_URL}/bookings/cancel/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message || "Appointment cancelled successfully.");
      // Reload page or force re-fetch
      window.location.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleForm.date || rescheduleForm.slotIndex === "") {
      toast.error("Please fill in both date and time slot.");
      return;
    }

    const doctorTimeSlots = rescheduleData.doctor.timeSlots || [];
    const timeSlot = doctorTimeSlots[parseInt(rescheduleForm.slotIndex)];

    setRescheduleLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/reschedule/${rescheduleData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          appointmentDate: rescheduleForm.date,
          timeSlot,
        }),
      });

      const data = await res.json();
      setRescheduleLoading(false);
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message || "Appointment rescheduled successfully!");
      setRescheduleData(null);
      setRescheduleForm({ date: "", slotIndex: "" });
      window.location.reload();
    } catch (err) {
      toast.error(err.message);
      setRescheduleLoading(false);
    }
  };

  // Upload report to Cloudinary and then register with booking
  const handleReportUpload = async (e, bookingId) => {
    const file = e.target.files[0];
    if (!file || !reportName.trim()) {
      toast.warning("Please enter a report name first.");
      return;
    }
    setUploadingReport(true);
    try {
      // Upload to Cloudinary via unsigned preset
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "doctor_portal");
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/dnb4jcioy/auto/upload`,
        { method: "POST", body: formData }
      );
      const cloudJson = await cloudRes.json();
      if (!cloudJson.secure_url) throw new Error("Cloudinary upload failed");

      // Register report URL with booking
      const res = await fetch(`${BASE_URL}/bookings/upload-reports/${bookingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: reportName.trim(), fileUrl: cloudJson.secure_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`Report "${reportName}" uploaded successfully!`);
      setReportName("");
      setShowReportUpload(null);
      window.location.reload();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingReport(false);
    }
  };

  const handleScheduleFollowup = async (bookingId) => {
    if (!followupDate || followupSlotIndex === "") {
      toast.error("Please fill in date and time slot.");
      return;
    }
    const booking = bookings.find((b) => b._id === bookingId);
    const doctorTimeSlots = booking?.doctor?.timeSlots || [];
    const timeSlot = doctorTimeSlots[parseInt(followupSlotIndex)];
    if (!timeSlot) {
      toast.error("Invalid time slot selection.");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/bookings/schedule-followup/${bookingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ appointmentDate: followupDate, timeSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Free follow-up video consultation scheduled!");
      setShowFollowupForm(null);
      setFollowupDate("");
      setFollowupSlotIndex("");
      window.location.reload();
    } catch (err) {
      toast.error(err.message || "Scheduling failed");
    }
  };

  const fetchAiSummary = async (booking) => {
    setAiLoading(true);
    setAiSummaryData("Analyzing symptoms and preparing clinical pre-appointment summary...");
    try {
      const res = await fetch(`${BASE_URL}/ai/appointment-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          symptoms: booking.symptoms || "No symptoms reported explicitly.",
          patientName: booking.user?.name,
          patientAge: booking.user?.gender ? "Adult" : "N/A",
          patientGender: booking.user?.gender,
        }),
      });

      const data = await res.json();
      setAiLoading(false);
      if (!res.ok) throw new Error(data.message);

      setAiSummaryData(data.summary);
    } catch (err) {
      toast.error(err.message);
      setAiLoading(false);
      setAiSummaryData(null);
    }
  };

  return (
    <div className="mt-6">
      {loading && !error && <Loading />}
      {error && !loading && <Error errMsg={error} />}
      {!loading && !error && bookings?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white p-5 border border-gray-100 shadow-sm rounded-lg hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-headingColor">
                      Dr. {booking.doctor?.name || "Doctor"}
                    </h4>
                    <p className="text-xs text-textColor font-medium">
                      {booking.doctor?.specialization}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      booking.status === "confirmed" || booking.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="text-sm text-textColor space-y-1 py-3 border-t border-b border-dashed border-gray-100 my-3">
                  <p>
                    <span className="font-semibold text-headingColor">Date:</span>{" "}
                    {booking.appointmentDate}
                  </p>
                  <p>
                    <span className="font-semibold text-headingColor">Time:</span>{" "}
                    {booking.timeSlot
                      ? `${convertTime(booking.timeSlot.startingTime)} - ${convertTime(
                          booking.timeSlot.endingTime
                        )} (${booking.timeSlot.day})`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-headingColor">Price:</span>{" "}
                    {booking.ticketPrice} INR
                  </p>
                  {booking.symptoms && (
                    <p className="text-xs text-gray-500 italic mt-2">
                      &ldquo;{booking.symptoms}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Telemedicine: Prescribed Tests */}
              {booking.prescribedTests?.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs">
                  <p className="font-bold text-blue-800 mb-1 flex items-center gap-1.5"><FaFileMedical /> Prescribed Tests:</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-0.5">
                    {booking.prescribedTests.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}

              {/* Uploaded Reports */}
              {booking.uploadedReports?.length > 0 && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs">
                  <p className="font-bold text-emerald-800 mb-1">Uploaded Reports:</p>
                  {booking.uploadedReports.map((r, i) => (
                    <a key={i} href={r.fileUrl} target="_blank" rel="noreferrer"
                      className="block text-emerald-700 underline truncate">
                      {r.name}
                    </a>
                  ))}
                </div>
              )}

              {/* Upload Report Panel */}
              {showReportUpload === booking._id && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-2">
                  <input
                    type="text"
                    placeholder="Report name (e.g. CBC Blood Test)"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-primaryColor"
                  />
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleReportUpload(e, booking._id)}
                    className="w-full text-xs"
                    disabled={uploadingReport}
                  />
                  {uploadingReport && <p className="text-[10px] text-gray-500">Uploading...</p>}
                  <button onClick={() => setShowReportUpload(null)} className="text-[10px] text-red-500">Cancel</button>
                </div>
              )}

              {/* Follow-up Scheduling Form */}
              {showFollowupForm === booking._id && (
                <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-2">
                  <p className="font-bold text-teal-800">Schedule Free Follow-up Call</p>
                  <input
                    type="date"
                    min={todayStr}
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none"
                  />
                  <select
                    value={followupSlotIndex}
                    onChange={(e) => setFollowupSlotIndex(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="">Select time slot</option>
                    {(booking.doctor?.timeSlots || []).map((slot, i) => (
                      <option key={i} value={i}>
                        {slot.day} {convertTime(slot.startingTime)} - {convertTime(slot.endingTime)}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleScheduleFollowup(booking._id)}
                      className="bg-primaryColor text-white text-[10px] px-3 py-1.5 rounded font-bold"
                    >
                      Confirm
                    </button>
                    <button onClick={() => setShowFollowupForm(null)} className="text-[10px] text-red-500">Cancel</button>
                  </div>
                </div>
              )}

              {/* AI Visit Summary (after video call completion) */}
              {booking.aiSummary?.diagnosis && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-purple-800 mb-1">🤖 AI Visit Summary</p>
                  <p><span className="font-semibold">Diagnosis:</span> {booking.aiSummary.diagnosis}</p>
                  <p><span className="font-semibold">Medications:</span> {booking.aiSummary.medications}</p>
                  <p><span className="font-semibold">Reminders:</span> {booking.aiSummary.reminders}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap pt-3 justify-end">
                {/* Join Video Call Button */}
                {(booking.consultationType === "video-followup" || booking.consultationType === "video-instant") &&
                  booking.meetingRoom &&
                  (booking.status === "confirmed" || booking.status === "approved") && (
                  <button
                    onClick={() => navigate(`/video-call/${booking._id}`)}
                    className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-teal-600/20"
                  >
                    <FaVideo /> Join Consultation
                  </button>
                )}

                {/* Upload Report (for physical completed appointments with prescribed tests) */}
                {booking.consultationType === "physical" &&
                  booking.status === "completed" &&
                  booking.prescribedTests?.length > 0 && (
                  <button
                    onClick={() => setShowReportUpload(showReportUpload === booking._id ? null : booking._id)}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1"
                  >
                    <FaCloudUploadAlt /> Upload Reports
                  </button>
                )}

                {/* Schedule Free Follow-up (if reports uploaded and within expiry) */}
                {booking.consultationType === "physical" &&
                  booking.status === "completed" &&
                  booking.uploadedReports?.length > 0 &&
                  booking.followupExpiry &&
                  new Date() <= new Date(booking.followupExpiry) && (
                  <button
                    onClick={() => setShowFollowupForm(showFollowupForm === booking._id ? null : booking._id)}
                    className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1"
                  >
                    <FaVideo /> Free Follow-up Call
                  </button>
                )}

                {booking.symptoms && (
                  <button
                    onClick={() => fetchAiSummary(booking)}
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md font-semibold"
                  >
                    AI Symptom Summary
                  </button>
                )}
                {booking.status !== "cancelled" && (
                  <>
                    <button
                      onClick={() => {
                        setRescheduleData(booking);
                        setRescheduleForm({ date: "", slotIndex: "" });
                      }}
                      className="text-xs bg-primaryColor hover:opacity-90 text-white px-3 py-1.5 rounded-md font-semibold"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(booking._id)}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-md font-semibold"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && bookings?.length === 0 && (
        <h2 className="mt-8 leading-7 text-[16px] md:text-[18px] font-[600] text-primaryColor">
          You do not have any appointments yet!
        </h2>
      )}

      {/* Reschedule Modal */}
      {rescheduleData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-[450px]">
            <h4 className="text-lg font-bold text-headingColor mb-4">
              Reschedule Appointment
            </h4>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-headingColor block mb-1">
                  Choose New Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  required
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:border-primaryColor text-sm text-textColor"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-headingColor block mb-1">
                  Choose Available Slot
                </label>
                <select
                  required
                  value={rescheduleForm.slotIndex}
                  onChange={(e) =>
                    setRescheduleForm({ ...rescheduleForm, slotIndex: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded bg-white focus:outline-none focus:border-primaryColor text-sm text-textColor"
                >
                  <option value="">Select a time slot</option>
                  {(rescheduleData.doctor?.timeSlots || []).map((slot, index) => (
                    <option key={index} value={index}>
                      {slot.day}: {convertTime(slot.startingTime)} - {convertTime(slot.endingTime)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleData(null)}
                  className="px-4 py-2 border rounded text-sm text-textColor hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="px-4 py-2 bg-primaryColor text-white rounded text-sm font-semibold hover:opacity-90 transition-all"
                >
                  {rescheduleLoading ? "Rescheduling..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {aiSummaryData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-[550px] max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-headingColor mb-3">AI Clinical Pre-Appointment Summary</h4>
            <div className="text-sm text-textColor space-y-4 bg-gray-50 p-4 rounded border border-gray-100 whitespace-pre-wrap leading-6">
              {aiSummaryData}
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setAiSummaryData(null)}
                className="px-4 py-2 bg-[#181A1E] text-white rounded text-sm font-semibold hover:bg-black transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
