import { useState, useEffect } from "react";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { FaHospital, FaUserMd, FaUsers, FaPlus, FaBed, FaUserCheck } from "react-icons/fa";

export default function OrgDashboard() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
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

  useEffect(() => {
    fetchBranches();
  }, []);

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

  return (
    <div className="container max-w-[1200px] mx-auto px-4 py-10 min-h-[80vh]">
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
              <div key={b._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-teal-50 border border-teal-200 text-teal-700 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                      {b.verificationStatus || "Active"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">License: {b.licenseNumber || "N/A"}</span>
                  </div>
                  <h3 className="font-extrabold text-headingColor text-lg leading-snug">{b.name}</h3>
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
    </div>
  );
}
