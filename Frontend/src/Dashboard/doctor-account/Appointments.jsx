import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/formatDate";
import { BASE_URL } from "../../config";
import { toast } from "react-toastify";
import convertTime from "../../utils/convertTime";
import { FaVideo, FaFileMedical, FaCloudUploadAlt } from "react-icons/fa";

const Appointments = ({ appointments }) => {
  const navigate = useNavigate();
  const [apptList, setApptList] = useState(appointments || []);

  // Modals / Detail Views State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [patientReports, setPatientReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [prescriptionAppt, setPrescriptionAppt] = useState(null);
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", duration: "", instructions: "" }]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  // Telemedicine
  const [prescribeTestsAppt, setPrescribeTestsAppt] = useState(null);
  const [testsList, setTestsList] = useState("");
  const [savingTests, setSavingTests] = useState(false);
  const [viewReportsAppt, setViewReportsAppt] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Filters
  const todayAppointments = apptList.filter((item) => item.appointmentDate === todayStr);
  const upcomingAppointments = apptList.filter((item) => item.appointmentDate > todayStr);
  const pastAppointments = apptList.filter((item) => item.appointmentDate < todayStr);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const response = await fetch(`${BASE_URL}/bookings/updateStatus/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        setApptList((prev) =>
          prev.map((item) => (item._id === appointmentId ? { ...item, status: newStatus } : item))
        );
        toast.success(`Appointment status updated to ${newStatus}`);
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  // Fetch Patient History (Profile settings + past reports)
  const viewPatientHistory = async (patient) => {
    setSelectedPatient(patient);
    setLoadingHistory(true);
    try {
      // Fetch report files
      const res = await fetch(`${BASE_URL}/reports?patientId=${patient._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const resData = await res.json();
      if (res.ok) {
        setPatientReports(resData.data);
      }
    } catch (err) {
      toast.error("Failed to load patient report files.");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Add medicine row
  const addMedicineRow = () => {
    setMedicines([...medicines, { name: "", dosage: "", duration: "", instructions: "" }]);
  };

  // Remove medicine row
  const removeMedicineRow = (index) => {
    setMedicines(medicines.filter((_, idx) => idx !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines(
      medicines.map((med, idx) => (idx === index ? { ...med, [field]: value } : med))
    );
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (medicines.some((m) => !m.name || !m.dosage || !m.duration)) {
      toast.error("Please fill in medicine name, dosage, and duration for all items.");
      return;
    }

    setPrescriptionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user: prescriptionAppt.user._id,
          booking: prescriptionAppt._id,
          medicines,
          notes: prescriptionNotes,
        }),
      });

      const data = await res.json();
      setPrescriptionLoading(false);
      if (!res.ok) throw new Error(data.message);

      toast.success("Prescription generated and patient notified!");
      // Automatically update appointment status to 'completed'
      setApptList((prev) =>
        prev.map((item) =>
          item._id === prescriptionAppt._id ? { ...item, status: "completed" } : item
        )
      );
      setPrescriptionAppt(null);
      setMedicines([{ name: "", dosage: "", duration: "", instructions: "" }]);
      setPrescriptionNotes("");
    } catch (err) {
      toast.error(err.message);
      setPrescriptionLoading(false);
    }
  };

  // Prescribe lab tests handler
  const handlePrescribeTests = async () => {
    if (!testsList.trim()) {
      toast.error("Please enter at least one test.");
      return;
    }
    const tests = testsList.split(",").map((t) => t.trim()).filter(Boolean);
    setSavingTests(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/prescribe-tests/${prescribeTestsAppt._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ tests }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Lab tests prescribed and patient notified!");
      setPrescribeTestsAppt(null);
      setTestsList("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingTests(false);
    }
  };

  const renderTable = (list, title) => (
    <div className="mb-10">
      <h4 className="font-bold text-headingColor mb-4 border-b pb-2">{title}</h4>
      {list.length === 0 ? (
        <p className="text-textColor text-sm italic">No appointments in this category.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-sm text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Symptoms</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50 text-textColor">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={item.user?.photo || "https://res.cloudinary.com/default-avatar.png"}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-bold text-headingColor">{item.user?.name}</div>
                      <div className="text-xs text-gray-400">{item.user?.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {item.appointmentDate} <br />
                    <span className="text-gray-400 font-semibold">
                      {item.timeSlot
                        ? `${convertTime(item.timeSlot.startingTime)} - ${convertTime(
                            item.timeSlot.endingTime
                          )}`
                        : "N/A"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs italic truncate max-w-[150px]">
                    {item.symptoms || "None reported"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                      className="text-xs border rounded p-1 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No Show</option>
                      <option value="rescheduled">Rescheduled</option>
                      <option value="approved">Approved</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => viewPatientHistory(item.user)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1.5 rounded font-semibold"
                      >
                        History
                      </button>
                      {item.status !== "completed" && item.status !== "cancelled" && (
                        <button
                          onClick={() => setPrescriptionAppt(item)}
                          className="bg-primaryColor hover:opacity-90 text-white text-xs px-2.5 py-1.5 rounded font-semibold"
                        >
                          Rx
                        </button>
                      )}
                      {/* Prescribe Lab Tests */}
                      {item.status === "completed" && item.consultationType === "physical" && (
                        <button
                          onClick={() => { setPrescribeTestsAppt(item); setTestsList(item.prescribedTests?.join(", ") || ""); }}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs px-2.5 py-1.5 rounded font-semibold flex items-center gap-1"
                        >
                          <FaFileMedical size={10}/> Tests
                        </button>
                      )}
                      {/* View Uploaded Reports */}
                      {item.uploadedReports?.length > 0 && (
                        <button
                          onClick={() => setViewReportsAppt(viewReportsAppt?._id === item._id ? null : item)}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs px-2.5 py-1.5 rounded font-semibold flex items-center gap-1"
                        >
                          <FaCloudUploadAlt size={10}/> Reports
                        </button>
                      )}
                      {/* Start/Join Video Consultation */}
                      {(item.consultationType === "video-followup" || item.consultationType === "video-instant") &&
                        item.meetingRoom &&
                        (item.status === "confirmed" || item.status === "approved") && (
                        <button
                          onClick={() => navigate(`/video-call/${item._id}`)}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-2.5 py-1.5 rounded font-semibold flex items-center gap-1 transition-all"
                        >
                          <FaVideo size={10}/> Start Consultation
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {renderTable(todayAppointments, "Today's Schedule")}
      {renderTable(upcomingAppointments, "Upcoming Appointments")}
      {renderTable(pastAppointments, "Past Appointments")}

      {/* Prescribe Lab Tests Modal */}
      {prescribeTestsAppt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-[480px]">
            <h4 className="text-base font-bold text-headingColor mb-1 flex items-center gap-2">
              <FaFileMedical className="text-blue-600" /> Prescribe Lab Tests
            </h4>
            <p className="text-xs text-textColor mb-4">
              Patient: <span className="font-bold">{prescribeTestsAppt.user?.name}</span>
              &nbsp;·&nbsp;Appointment: {prescribeTestsAppt.appointmentDate}
            </p>
            <label className="text-xs font-semibold text-headingColor block mb-1.5">
              Tests (comma-separated)
            </label>
            <textarea
              rows={3}
              value={testsList}
              onChange={(e) => setTestsList(e.target.value)}
              placeholder="e.g. CBC, Chest X-Ray, Blood Sugar"
              className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primaryColor"
            />
            <p className="text-[10px] text-gray-400 mt-1 mb-4">
              Patient will see these tests and be able to upload reports within 10 days.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setPrescribeTestsAppt(null); setTestsList(""); }}
                className="text-xs text-red-500 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handlePrescribeTests}
                disabled={savingTests}
                className="bg-primaryColor text-white text-xs px-4 py-2 rounded-xl font-bold"
              >
                {savingTests ? "Saving..." : "Prescribe Tests"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Patient Uploaded Reports */}
      {viewReportsAppt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-[500px]">
            <h4 className="text-base font-bold text-headingColor mb-4 flex items-center gap-2">
              <FaCloudUploadAlt className="text-emerald-600" /> Patient Uploaded Reports
            </h4>
            <p className="text-xs text-textColor mb-3">
              Patient: <span className="font-bold">{viewReportsAppt.user?.name}</span>
            </p>
            {viewReportsAppt.uploadedReports?.length > 0 ? (
              <div className="space-y-2">
                {viewReportsAppt.uploadedReports.map((r, i) => (
                  <a
                    key={i}
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 hover:bg-emerald-100 transition-all"
                  >
                    <FaFileMedical />
                    <span className="font-semibold">{r.name}</span>
                    <span className="ml-auto text-[10px] text-gray-400">
                      {new Date(r.date).toLocaleDateString()}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No reports uploaded yet.</p>
            )}
            <button
              onClick={() => setViewReportsAppt(null)}
              className="mt-5 text-xs text-red-500 hover:underline block ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-[600px] max-h-[85vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-headingColor mb-4">Patient Profile Details</h4>
            {loadingHistory ? (
              <div className="py-10 text-center text-sm text-textColor">Loading patient files...</div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
                  <img
                    src={selectedPatient.photo || "https://res.cloudinary.com/default-avatar.png"}
                    alt=""
                    className="w-16 h-16 object-cover rounded-full"
                  />
                  <div>
                    <h5 className="font-bold text-headingColor">{selectedPatient.name}</h5>
                    <p className="text-xs text-textColor">{selectedPatient.email}</p>
                    <p className="text-xs text-indigo-700 font-semibold mt-1">
                      Blood Group: {selectedPatient.bloodGroup || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <h6 className="text-xs font-bold uppercase text-gray-400 mb-1">Medical History</h6>
                  <p className="text-sm text-textColor bg-gray-50 p-3 rounded">
                    {selectedPatient.medicalHistory || "No reported medical history."}
                  </p>
                </div>

                <div>
                  <h6 className="text-xs font-bold uppercase text-gray-400 mb-1">Emergency Contact</h6>
                  {selectedPatient.emergencyContact?.name ? (
                    <div className="text-sm text-textColor bg-gray-50 p-3 rounded">
                      <p><strong>Name:</strong> {selectedPatient.emergencyContact.name}</p>
                      <p><strong>Relationship:</strong> {selectedPatient.emergencyContact.relationship}</p>
                      <p><strong>Phone:</strong> {selectedPatient.emergencyContact.phone}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-textColor bg-gray-50 p-3 rounded italic">None registered.</p>
                  )}
                </div>

                <div>
                  <h6 className="text-xs font-bold uppercase text-gray-400 mb-2">Uploaded Medical Reports</h6>
                  {patientReports.length === 0 ? (
                    <p className="text-xs text-textColor bg-gray-50 p-3 rounded italic">No files uploaded.</p>
                  ) : (
                    <div className="space-y-2">
                      {patientReports.map((report) => (
                        <div
                          key={report._id}
                          className="flex justify-between items-center p-2.5 border rounded-md hover:bg-gray-50 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-headingColor">{report.title}</p>
                            <span className="text-[10px] text-gray-400 uppercase">{report.fileType}</span>
                          </div>
                          <a
                            href={report.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-semibold"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientReports([]);
                }}
                className="px-4 py-2 bg-[#181A1E] text-white rounded text-sm font-semibold hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Issue Modal */}
      {prescriptionAppt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-[650px] max-h-[85vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-headingColor mb-4">
              Issue Prescription: Rx
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-xs text-textColor">
              <p><strong>Patient:</strong> {prescriptionAppt.user?.name}</p>
              <p><strong>Date:</strong> {prescriptionAppt.appointmentDate}</p>
            </div>

            <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-headingColor block mb-2">
                  Medicines Checklist
                </label>
                <div className="space-y-3">
                  {medicines.map((med, idx) => (
                    <div key={idx} className="flex gap-2 flex-wrap items-center border-b pb-3 border-gray-100">
                      <input
                        type="text"
                        required
                        placeholder="Drug Name"
                        value={med.name}
                        onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                        className="flex-1 min-w-[120px] px-3 py-1.5 border rounded text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Dosage (e.g. 1-0-1)"
                        value={med.dosage}
                        onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                        className="w-24 px-3 py-1.5 border rounded text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Duration (e.g. 5 days)"
                        value={med.duration}
                        onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                        className="w-28 px-3 py-1.5 border rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Instructions (e.g. after meals)"
                        value={med.instructions}
                        onChange={(e) => handleMedicineChange(idx, "instructions", e.target.value)}
                        className="flex-1 min-w-[120px] px-3 py-1.5 border rounded text-xs"
                      />
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(idx)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-bold"
                        >
                          X
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addMedicineRow}
                  className="mt-3 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded font-semibold"
                >
                  + Add Medication Row
                </button>
              </div>

              <div>
                <label className="text-sm font-semibold text-headingColor block mb-1">
                  Additional Doctor Instructions / Notes
                </label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Rest instructions, drinking more water, physical restrictions..."
                  className="w-full p-2.5 border rounded text-xs"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPrescriptionAppt(null);
                    setMedicines([{ name: "", dosage: "", duration: "", instructions: "" }]);
                    setPrescriptionNotes("");
                  }}
                  className="px-4 py-2 border rounded text-sm text-textColor hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prescriptionLoading}
                  className="px-4 py-2 bg-primaryColor text-white rounded text-sm font-semibold hover:opacity-90"
                >
                  {prescriptionLoading ? "Issuing..." : "Submit Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
