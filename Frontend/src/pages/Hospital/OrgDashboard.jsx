import { useState, useEffect } from "react";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { 
  FaHospital, FaUserMd, FaUsers, FaPlus, FaBed, FaUserCheck, 
  FaArrowLeft, FaMapMarkerAlt, FaFileMedical, FaRegClock, FaDollarSign 
} from "react-icons/fa";

export default function OrgDashboard() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allDoctors, setAllDoctors] = useState([]);
  
  // Dashboard navigation states
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchTab, setBranchTab] = useState("overview"); // overview, doctors, queue, beds, treatments
  const [branchQueue, setBranchQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [updatingBeds, setUpdatingBeds] = useState(false);
  const [bedEdit, setBedEdit] = useState({ general: 0, icu: 0 });

  // Treatment Pricing States
  const [localTreatments, setLocalTreatments] = useState([]);
  const [newTreatment, setNewTreatment] = useState({ name: "", cost: "" });
  const [savingPricing, setSavingPricing] = useState(false);

  // Modal open states
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [editDoctorForm, setEditDoctorForm] = useState(null);
  
  const token = localStorage.getItem("token");

  // Form states
  const [branchForm, setBranchForm] = useState({
    name: "", location: "", address: "", city: "", phone: "", licenseNumber: "", totalBeds: 50, totalIcuBeds: 10, specialties: ""
  });
  const [doctorForm, setDoctorForm] = useState({
    name: "", email: "", password: "", ticketPrice: 500, specialization: "", department: "", branchId: ""
  });
  const [staffForm, setStaffForm] = useState({
    name: "", email: "", password: "", role: "receptionist", branchId: ""
  });

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm("Are you sure you want to remove this doctor from clinical branches?")) return;
    try {
      const res = await fetch(`${BASE_URL}/doctors/${doctorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Doctor removed successfully!");
      fetchAllDoctors();
    } catch (err) {
      toast.error(err.message || "Failed to remove doctor");
    }
  };

  const handleEditDoctorClick = (doctor) => {
    setEditDoctorForm(doctor);
    setShowEditDoctorModal(true);
  };

  const handleEditDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/doctors/${editDoctorForm._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editDoctorForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Doctor details updated successfully!");
      setShowEditDoctorModal(false);
      fetchAllDoctors();
    } catch (err) {
      toast.error(err.message || "Failed to update doctor details");
    }
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBranches(data.data || []);
      }
    } catch (err) {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDoctors = async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/all`);
      const data = await res.json();
      if (res.ok) {
        setAllDoctors(data.data || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchBranches();
    fetchAllDoctors();
  }, []);

  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    setBedEdit({
      general: branch.beds?.general?.available ?? 0,
      icu: branch.beds?.icu?.available ?? 0
    });
    setLocalTreatments(branch.treatmentCosts || []);
    setBranchTab("overview");
    fetchBranchQueue(branch._id);
  };

  const fetchBranchQueue = async (branchId) => {
    setQueueLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/hospitals/${branchId}/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBranchQueue(data.data || []);
      }
    } catch (e) {
      console.log("Queue load issue:", e.message);
    } finally {
      setQueueLoading(false);
    }
  };

  const handleUpdateBedsSubmit = async (e) => {
    e.preventDefault();
    setUpdatingBeds(true);
    try {
      const res = await fetch(`${BASE_URL}/hospitals/${selectedBranch._id}/beds`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          availableBeds: bedEdit.general,
          availableIcuBeds: bedEdit.icu
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("Beds capacity updated!");
      setSelectedBranch(prev => ({
        ...prev,
        beds: {
          ...prev.beds,
          general: { ...prev.beds.general, available: bedEdit.general },
          icu: { ...prev.beds.icu, available: bedEdit.icu }
        }
      }));
      fetchBranches();
    } catch (err) {
      toast.error(err.message || "Failed to update beds");
    } finally {
      setUpdatingBeds(false);
    }
  };

  const handleCostChange = (index, value) => {
    const updated = [...localTreatments];
    updated[index].cost = value;
    setLocalTreatments(updated);
  };

  const handleRemoveTreatment = (index) => {
    setLocalTreatments(localTreatments.filter((_, idx) => idx !== index));
  };

  const handleAddTreatmentRow = () => {
    if (!newTreatment.name.trim() || !newTreatment.cost) {
      toast.warning("Please fill in both treatment name and cost.");
      return;
    }
    setLocalTreatments([
      ...localTreatments,
      { treatmentName: newTreatment.name.trim(), cost: parseInt(newTreatment.cost) || 0 }
    ]);
    setNewTreatment({ name: "", cost: "" });
  };

  const handleSavePricing = async () => {
    setSavingPricing(true);
    try {
      const res = await fetch(`${BASE_URL}/hospitals/${selectedBranch._id}/treatments`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ treatmentCosts: localTreatments })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("Pricing sheet saved successfully!");
      setSelectedBranch(prev => ({
        ...prev,
        treatmentCosts: localTreatments
      }));
      fetchBranches();
    } catch (err) {
      toast.error(err.message || "Failed to save pricing sheet");
    } finally {
      setSavingPricing(false);
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      const specs = branchForm.specialties.split(",").map(s => s.trim());
      const res = await fetch(`${BASE_URL}/hospitals/register-branch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...branchForm, specialties: specs })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Branch registered successfully!");
      setShowBranchModal(false);
      fetchBranches();
    } catch (err) {
      toast.error(err.message || "Failed to create branch");
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/hospitals/${doctorForm.branchId}/doctors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(doctorForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Doctor onboarded successfully!");
      setShowDoctorModal(false);
      fetchAllDoctors();
    } catch (err) {
      toast.error(err.message || "Failed to onboard doctor");
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/hospitals/${staffForm.branchId}/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(staffForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Staff onboarded successfully!");
      setShowStaffModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to onboard staff");
    }
  };

  // Filter doctors associated with the selected branch
  const branchDoctors = allDoctors.filter(d => d.hospital === selectedBranch?._id);

  return (
    <div className="container max-w-[1200px] mx-auto px-4 py-10 min-h-[80vh]">
      
      {/* ─── Back Arrow & Branch Context Header ─── */}
      {selectedBranch ? (
        <div className="mb-8 border-b pb-6">
          <button 
            onClick={() => setSelectedBranch(null)}
            className="flex items-center gap-1.5 text-xs text-textColor font-bold hover:text-primaryColor transition-all mb-4"
          >
            <FaArrowLeft /> Back to Workspace Directory
          </button>
          
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-headingColor">{selectedBranch.name}</h2>
              <p className="text-xs text-textColor mt-1.5 flex items-center gap-1">
                <FaMapMarkerAlt /> {selectedBranch.address}, {selectedBranch.city}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setDoctorForm(prev => ({ ...prev, branchId: selectedBranch._id }));
                  setShowDoctorModal(true);
                }} 
                className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              >
                <FaPlus/> Onboard Doctor
              </button>
              <button 
                onClick={() => {
                  setStaffForm(prev => ({ ...prev, branchId: selectedBranch._id }));
                  setShowStaffModal(true);
                }} 
                className="border border-gray-300 hover:bg-gray-50 text-headingColor font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <FaPlus/> Onboard Staff
              </button>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="flex gap-2 mt-6 border-b pb-1">
            {[
              { id: "overview", label: "Overview & Specs" },
              { id: "doctors", label: `Doctors (${branchDoctors.length})` },
              { id: "queue", label: `Patient Queue (${branchQueue.length})` },
              { id: "beds", label: "Bed Capacity Manager" },
              { id: "treatments", label: "Treatment Pricing (HMS)" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setBranchTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[3px] ${
                  branchTab === tab.id 
                    ? "border-primaryColor text-primaryColor font-extrabold" 
                    : "border-transparent text-textColor hover:text-headingColor"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-between items-center mb-8 border-b pb-6 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-headingColor">Hospital Operating System</h2>
            <p className="text-xs text-textColor mt-1">Manage clinical branches, schedule staff, and monitor live wait queues</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowBranchModal(true)} className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all">
              <FaPlus/> Add Branch
            </button>
            <button onClick={() => setShowDoctorModal(true)} className="border border-primaryColor text-primaryColor hover:bg-teal-50/20 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all">
              <FaUserMd/> Onboard Doctor
            </button>
            <button onClick={() => setShowStaffModal(true)} className="border border-gray-300 hover:bg-gray-50 text-headingColor font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all">
              <FaUsers/> Onboard Staff
            </button>
          </div>
        </div>
      )}

      {/* ─── Dashboard Content Views ─── */}
      {selectedBranch ? (
        <div className="bg-white border rounded-2xl p-6 shadow-sm min-h-[50vh]">
          
          {/* Tab 1: Overview */}
          {branchTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-extrabold text-headingColor text-base">Workspace Specifications</h4>
                <p className="text-xs text-textColor mt-0.5">Basic registry metrics and compliance license markers.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3.5">
                  <div className="flex justify-between border-b pb-2.5 text-xs text-textColor">
                    <span className="font-semibold text-headingColor">Distance Metric:</span>
                    <span>{selectedBranch.distance} km</span>
                  </div>
                  <div className="flex justify-between border-b pb-2.5 text-xs text-textColor">
                    <span className="font-semibold text-headingColor">OPD Wait Index:</span>
                    <span>{selectedBranch.waitingTime} minutes</span>
                  </div>
                  <div className="flex justify-between border-b pb-2.5 text-xs text-textColor">
                    <span className="font-semibold text-headingColor">Registration Code:</span>
                    <span className="font-mono text-headingColor">{selectedBranch.licenseNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2.5 text-xs text-textColor">
                    <span className="font-semibold text-headingColor">Verification Status:</span>
                    <span className="bg-teal-50 border border-teal-200 text-teal-700 text-[10px] px-2.5 py-0.5 rounded font-bold uppercase">{selectedBranch.verificationStatus || "Active"}</span>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 border rounded-xl space-y-3">
                  <h5 className="text-xs font-bold text-headingColor uppercase tracking-wider">Clinical Specialty Coverage</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBranch.specialties?.map((spec, i) => (
                      <span key={i} className="bg-white border text-headingColor text-xs px-2.5 py-1 rounded-md font-semibold">
                        {spec}
                      </span>
                    ))}
                  </div>
                  <h5 className="text-xs font-bold text-headingColor uppercase tracking-wider pt-2">Accepted Insurance Networks</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBranch.supportedInsurances?.map((ins, i) => (
                      <span key={i} className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs px-2.5 py-1 rounded-md font-semibold">
                        {ins}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Onboarded Doctors */}
          {branchTab === "doctors" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-extrabold text-headingColor text-base">Active Clinical Staff</h4>
                <p className="text-xs text-textColor mt-0.5">List of certified practitioners registered at this workspace.</p>
              </div>

              {branchDoctors.length === 0 ? (
                <div className="text-center py-12 text-textColor border border-dashed rounded-xl">
                  <FaUserMd size={30} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-xs font-semibold">No doctors onboarded to this branch yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-gray-100 rounded-xl overflow-hidden">
                    <thead className="bg-gray-50 text-headingColor uppercase tracking-wide">
                      <tr>
                        <th className="p-3 border-b">Name</th>
                        <th className="p-3 border-b">Specialization</th>
                        <th className="p-3 border-b">Consult Fee</th>
                        <th className="p-3 border-b">Gender</th>
                        <th className="p-3 border-b">Rating</th>
                        <th className="p-3 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchDoctors.map((doc) => (
                        <tr key={doc._id} className="hover:bg-gray-50 border-b text-textColor">
                          <td className="p-3 font-semibold text-headingColor">{doc.name}</td>
                          <td className="p-3">{doc.specialization}</td>
                          <td className="p-3 font-bold text-headingColor">{doc.ticketPrice} INR</td>
                          <td className="p-3 capitalize">{doc.gender || "N/A"}</td>
                          <td className="p-3">⭐ {doc.averageRating} ({doc.totalRating})</td>
                          <td className="p-3 flex gap-2">
                            <button
                              onClick={() => handleEditDoctorClick(doc)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDoctor(doc._id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Patient Queue */}
          {branchTab === "queue" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-extrabold text-headingColor text-base">Active Patient Queue</h4>
                <p className="text-xs text-textColor mt-0.5">Live consultation slots and check-in statuses.</p>
              </div>

              {queueLoading ? (
                <div className="flex justify-center py-10"><HashLoader color="#0d9488" size={30} /></div>
              ) : branchQueue.length === 0 ? (
                <div className="text-center py-12 text-textColor border border-dashed rounded-xl">
                  <FaUsers size={30} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-xs font-semibold">No active patient bookings found in the queue.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-gray-100 rounded-xl overflow-hidden">
                    <thead className="bg-gray-50 text-headingColor uppercase">
                      <tr>
                        <th className="p-3 border-b">Patient</th>
                        <th className="p-3 border-b">Doctor</th>
                        <th className="p-3 border-b">Date / Slot</th>
                        <th className="p-3 border-b">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchQueue.map((q) => (
                        <tr key={q._id} className="hover:bg-gray-50 border-b text-textColor">
                          <td className="p-3">
                            <p className="font-semibold text-headingColor">{q.user?.name || "Patient"}</p>
                            <p className="text-[10px] text-gray-400">{q.user?.email}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-headingColor">{q.doctor?.name}</p>
                            <p className="text-[10px] text-gray-400">{q.doctor?.specialization}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-headingColor">{q.appointmentDate}</p>
                            <p className="text-[10px] text-gray-400">{q.timeSlot?.startingTime} - {q.timeSlot?.endingTime}</p>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              q.status === "confirmed" || q.status === "approved"
                                ? "bg-green-50 border border-green-200 text-green-700"
                                : q.status === "cancelled"
                                ? "bg-red-50 border border-red-200 text-red-700"
                                : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                            }`}>
                              {q.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Bed Manager */}
          {branchTab === "beds" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-extrabold text-headingColor text-base">Bed Capacity Manager</h4>
                <p className="text-xs text-textColor mt-0.5">Edit real-time clinical workspace capacity availability.</p>
              </div>

              <form onSubmit={handleUpdateBedsSubmit} className="max-w-[400px] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase">Available General Beds</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-gray-50 focus:bg-white"
                      value={bedEdit.general} 
                      onChange={(e) => setBedEdit({ ...bedEdit, general: parseInt(e.target.value) || 0 })} 
                    />
                    <span className="text-[10px] text-textColor mt-1 block">Out of {selectedBranch.beds?.general?.total || 50} total</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase">Available ICU Beds</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-gray-50 focus:bg-white"
                      value={bedEdit.icu} 
                      onChange={(e) => setBedEdit({ ...bedEdit, icu: parseInt(e.target.value) || 0 })} 
                    />
                    <span className="text-[10px] text-textColor mt-1 block">Out of {selectedBranch.beds?.icu?.total || 10} total</span>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={updatingBeds}
                  className="btn rounded-xl px-6 py-2.5 font-bold text-xs flex items-center justify-center"
                >
                  {updatingBeds ? <HashLoader size={16} color="#fff" /> : "Save Availability Updates"}
                </button>
              </form>
            </div>
          )}

          {/* Tab 5: Treatment Pricing (HMS) */}
          {branchTab === "treatments" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-extrabold text-headingColor text-base">Treatment & Service Pricing Manager</h4>
                <p className="text-xs text-textColor mt-0.5">Configure live fees for surgeries, check-ups, diagnostic scans, and clinical procedures.</p>
              </div>

              <div className="space-y-4 max-w-[600px]">
                {/* Existing Treatment List */}
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2 border-b pb-4">
                  {localTreatments.length === 0 ? (
                    <p className="text-xs text-textColor italic">No services priced yet. Add one below.</p>
                  ) : (
                    localTreatments.map((t, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-150 justify-between">
                        <span className="text-xs font-bold text-headingColor">{t.treatmentName}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={t.cost}
                            onChange={(e) => handleCostChange(idx, parseInt(e.target.value) || 0)}
                            className="w-24 px-2.5 py-1 border rounded-lg text-xs font-bold text-right"
                          />
                          <span className="text-xs text-textColor font-semibold">INR</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTreatment(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold pl-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Custom Treatment Form */}
                <div className="bg-teal-50/20 border border-teal-100 p-4 rounded-2xl space-y-3">
                  <h5 className="text-xs font-extrabold text-headingColor uppercase tracking-wider">Add Diagnostic Fee or Custom Surgery</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="e.g. X-Ray, Ultrasound, General Checkup"
                      value={newTreatment.name}
                      onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })}
                      className="px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Cost in INR"
                        value={newTreatment.cost}
                        onChange={(e) => setNewTreatment({ ...newTreatment, cost: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddTreatmentRow}
                        className="bg-primaryColor hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Changes Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSavePricing}
                    disabled={savingPricing}
                    className="btn rounded-xl px-6 py-3 font-bold text-xs"
                  >
                    {savingPricing ? "Saving Changes..." : "Save Live Pricing Sheet"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Workspace Directory Cards */
        <div>
          {loading ? (
            <div className="flex justify-center py-20"><HashLoader color="#0d9488" /></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.length === 0 ? (
                <div className="col-span-full bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-textColor">
                  <FaHospital size={40} className="mx-auto mb-3 text-gray-400" />
                  <p className="font-semibold">No active branches registered yet.</p>
                  <p className="text-xs mt-1">Click "Add Branch" at the top to configure your first clinical workspace.</p>
                </div>
              ) : (
                branches.map((b) => (
                  <div 
                    key={b._id} 
                    onClick={() => handleSelectBranch(b)}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-teal-50 border border-teal-200 text-teal-700 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                          {b.verificationStatus || "Active"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">License: {b.licenseNumber || "N/A"}</span>
                      </div>
                      <h3 className="font-extrabold text-headingColor text-lg leading-snug group-hover:text-primaryColor transition-all">{b.name}</h3>
                      <p className="text-xs text-textColor mt-1">{b.address}, {b.city}</p>
                      
                      {/* Bed Capacity Indicator */}
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-center">
                          <p className="text-emerald-700 font-extrabold text-lg">{b.beds?.general?.available} / {b.beds?.general?.total}</p>
                          <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wide">General Beds</p>
                        </div>
                        <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 text-center">
                          <p className="text-purple-700 font-extrabold text-lg">{b.beds?.icu?.available} / {b.beds?.icu?.total}</p>
                          <p className="text-[9px] font-bold text-purple-800 uppercase tracking-wide">ICU Beds</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-textColor">OPD Wait Time: <span className="text-primaryColor font-extrabold">{b.waitingTime || 15} min</span></span>
                      <span className="text-[10px] text-gray-400 font-bold">{b.specialties?.length || 0} Specialties</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* --- Branch Modal --- */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[500px] shadow-xl border">
            <h3 className="text-lg font-extrabold text-headingColor mb-4 flex items-center gap-2"><FaHospital className="text-primaryColor"/> Add Hospital Branch</h3>
            <form onSubmit={handleBranchSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Branch Name (e.g. Apollo Delhi)" required className="px-3 py-2 border rounded-lg text-xs" value={branchForm.name} onChange={(e) => setBranchForm({...branchForm, name: e.target.value})} />
                <input type="text" placeholder="Location/Area" required className="px-3 py-2 border rounded-lg text-xs" value={branchForm.location} onChange={(e) => setBranchForm({...branchForm, location: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="City" required className="px-3 py-2 border rounded-lg text-xs" value={branchForm.city} onChange={(e) => setBranchForm({...branchForm, city: e.target.value})} />
                <input type="text" placeholder="Phone Number" required className="px-3 py-2 border rounded-lg text-xs" value={branchForm.phone} onChange={(e) => setBranchForm({...branchForm, phone: e.target.value})} />
              </div>
              <input type="text" placeholder="Full Address" required className="w-full px-3 py-2 border rounded-lg text-xs" value={branchForm.address} onChange={(e) => setBranchForm({...branchForm, address: e.target.value})} />
              <input type="text" placeholder="License Code / Registration ID" required className="w-full px-3 py-2 border rounded-lg text-xs" value={branchForm.licenseNumber} onChange={(e) => setBranchForm({...branchForm, licenseNumber: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Total General Beds" required className="px-3 py-2 border rounded-lg text-xs" value={branchForm.totalBeds} onChange={(e) => setBranchForm({...branchForm, totalBeds: parseInt(e.target.value)})} />
                <input type="number" placeholder="Total ICU Beds" required className="px-3 py-2 border rounded-lg text-xs" value={branchForm.totalIcuBeds} onChange={(e) => setBranchForm({...branchForm, totalIcuBeds: parseInt(e.target.value)})} />
              </div>
              <input type="text" placeholder="Specialties (comma separated, e.g. Cardiology, Neurology)" required className="w-full px-3 py-2 border rounded-lg text-xs" value={branchForm.specialties} onChange={(e) => setBranchForm({...branchForm, specialties: e.target.value})} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBranchModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-textColor">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primaryColor text-white rounded-lg text-xs font-semibold">Register Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Doctor Modal --- */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[500px] shadow-xl border">
            <h3 className="text-lg font-extrabold text-headingColor mb-4 flex items-center gap-2"><FaUserMd className="text-primaryColor"/> Onboard Branch Doctor</h3>
            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              <select required className="w-full px-3 py-2 border rounded-lg text-xs" value={doctorForm.branchId} onChange={(e) => setDoctorForm({...doctorForm, branchId: e.target.value})}>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
              <input type="text" placeholder="Doctor's Full Name" required className="w-full px-3 py-2 border rounded-lg text-xs" value={doctorForm.name} onChange={(e) => setDoctorForm({...doctorForm, name: e.target.value})} />
              <input type="email" placeholder="Login Email" required className="w-full px-3 py-2 border rounded-lg text-xs" value={doctorForm.email} onChange={(e) => setDoctorForm({...doctorForm, email: e.target.value})} />
              <input type="password" placeholder="Assigned Password" required className="w-full px-3 py-2 border rounded-lg text-xs" value={doctorForm.password} onChange={(e) => setDoctorForm({...doctorForm, password: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Specialization" required className="px-3 py-2 border rounded-lg text-xs" value={doctorForm.specialization} onChange={(e) => setDoctorForm({...doctorForm, specialization: e.target.value})} />
                <input type="text" placeholder="Department" required className="px-3 py-2 border rounded-lg text-xs" value={doctorForm.department} onChange={(e) => setDoctorForm({...doctorForm, department: e.target.value})} />
              </div>
              <input type="number" placeholder="Consultation Fee (INR)" required className="w-full px-3 py-2 border rounded-lg text-xs" value={doctorForm.ticketPrice} onChange={(e) => setDoctorForm({...doctorForm, ticketPrice: parseInt(e.target.value)})} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDoctorModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-textColor">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primaryColor text-white rounded-lg text-xs font-semibold">Onboard Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Staff Modal --- */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[500px] shadow-xl border">
            <h3 className="text-lg font-extrabold text-headingColor mb-4 flex items-center gap-2"><FaUsers className="text-primaryColor"/> Onboard Branch Staff</h3>
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <select required className="w-full px-3 py-2 border rounded-lg text-xs" value={staffForm.branchId} onChange={(e) => setStaffForm({...staffForm, branchId: e.target.value})}>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
              <input type="text" placeholder="Staff Name" required className="w-full px-3 py-2 border rounded-lg text-xs" value={staffForm.name} onChange={(e) => setStaffForm({...staffForm, name: e.target.value})} />
              <input type="email" placeholder="Login Email" required className="w-full px-3 py-2 border rounded-lg text-xs" value={staffForm.email} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} />
              <input type="password" placeholder="Assigned Password" required className="w-full px-3 py-2 border rounded-lg text-xs" value={staffForm.password} onChange={(e) => setStaffForm({...staffForm, password: e.target.value})} />
              <select required className="w-full px-3 py-2 border rounded-lg text-xs" value={staffForm.role} onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}>
                <option value="receptionist">Receptionist</option>
                <option value="lab_tech">Lab Technician</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowStaffModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-textColor">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primaryColor text-white rounded-lg text-xs font-semibold">Onboard Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Edit Doctor Modal --- */}
      {showEditDoctorModal && editDoctorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[500px] shadow-xl border">
            <h3 className="text-lg font-extrabold text-headingColor mb-4 flex items-center gap-2">
              <FaUserMd className="text-primaryColor"/> Edit Doctor Details
            </h3>
            <form onSubmit={handleEditDoctorSubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="Doctor's Full Name" 
                required 
                className="w-full px-3 py-2 border rounded-lg text-xs" 
                value={editDoctorForm.name} 
                onChange={(e) => setEditDoctorForm({...editDoctorForm, name: e.target.value})} 
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Specialization" 
                  required 
                  className="px-3 py-2 border rounded-lg text-xs" 
                  value={editDoctorForm.specialization} 
                  onChange={(e) => setEditDoctorForm({...editDoctorForm, specialization: e.target.value})} 
                />
                <input 
                  type="text" 
                  placeholder="Department" 
                  required 
                  className="px-3 py-2 border rounded-lg text-xs" 
                  value={editDoctorForm.department} 
                  onChange={(e) => setEditDoctorForm({...editDoctorForm, department: e.target.value})} 
                />
              </div>
              <input 
                type="number" 
                placeholder="Consultation Fee (INR)" 
                required 
                className="w-full px-3 py-2 border rounded-lg text-xs" 
                value={editDoctorForm.ticketPrice} 
                onChange={(e) => setEditDoctorForm({...editDoctorForm, ticketPrice: parseInt(e.target.value) || 0})} 
              />
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditDoctorModal(false)} 
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-textColor"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primaryColor text-white rounded-lg text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
