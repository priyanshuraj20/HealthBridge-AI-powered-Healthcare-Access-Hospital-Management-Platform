import { useState, useEffect } from "react";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { FaUserCheck, FaClock, FaBed, FaSignal, FaCheckCircle, FaUserClock } from "react-icons/fa";

export default function ReceptionistQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bedUpdateLoading, setBedUpdateLoading] = useState(false);
  const [beds, setBeds] = useState({ availableBeds: 0, availableIcuBeds: 0 });
  
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchId = user.hospital; // Extracted branch reference

  const fetchQueue = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/hospitals/${branchId}/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQueue(data.data || []);
      }
    } catch (err) {
      toast.error("Failed to load queue details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [branchId]);

  const handleCheckIn = async (bookingId, status) => {
    try {
      const res = await fetch(`${BASE_URL}/hospitals/bookings/${bookingId}/checkin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`Check-in status updated to ${status}`);
      fetchQueue();
    } catch (err) {
      toast.error(err.message || "Failed to update check-in");
    }
  };

  const handleBedUpdate = async (e) => {
    e.preventDefault();
    setBedUpdateLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/hospitals/${branchId}/beds`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(beds)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Branch bed capacity updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update beds");
    } finally {
      setBedUpdateLoading(false);
    }
  };

  if (!branchId) {
    return (
      <div className="container max-w-[800px] mx-auto py-20 text-center text-textColor">
        <FaSignal size={40} className="mx-auto mb-3 text-red-400" />
        <p className="font-semibold text-lg">Hospital branch mapping missing</p>
        <p className="text-xs mt-1">Please make sure this staff account is onboarded under an active hospital branch.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-[1200px] mx-auto px-4 py-10 min-h-[85vh]">
      <div className="border-b pb-6 mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-headingColor">Reception Desk & Admissions</h2>
          <p className="text-xs text-textColor mt-1">Check-in patients, update wait queue statuses, and monitor live ICU allocations</p>
        </div>
        <button onClick={fetchQueue} className="border border-gray-300 text-xs font-semibold px-4 py-2 hover:bg-gray-50 rounded-lg">
          Refresh Queue
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT - Appointments Queue */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-extrabold text-headingColor text-base mb-3 flex items-center gap-2"><FaUserClock className="text-primaryColor"/> Daily Patient Queue</h3>
          
          {loading ? (
            <div className="flex justify-center py-20"><HashLoader color="#0d9488" /></div>
          ) : queue.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-textColor">
              <p className="font-bold">Queue is currently empty</p>
              <p className="text-xs mt-1">No appointments registered for today yet.</p>
            </div>
          ) : (
            queue.map(booking => (
              <div key={booking._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-headingColor text-sm">{booking.patient?.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({booking.patient?.gender})</span>
                  </div>
                  <div className="text-[11px] text-textColor space-y-0.5">
                    <p>Doctor: <span className="font-semibold text-headingColor">{booking.doctor?.name}</span> ({booking.doctor?.specialization})</p>
                    <p className="flex items-center gap-1"><FaClock className="text-primaryColor text-[10px]"/> {booking.appointmentDate} · {booking.timeSlot?.startingTime} - {booking.timeSlot?.endingTime}</p>
                    <p>Type: <span className="uppercase text-[9px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border">{booking.consultationType}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                    booking.status === "confirmed" ? "bg-green-50 border-green-200 text-green-700" :
                    booking.status === "pending" ? "bg-amber-50 border-amber-200 text-amber-700" :
                    "bg-gray-50 border-gray-200 text-gray-500"
                  }`}>
                    {booking.status}
                  </span>
                  
                  {booking.status === "pending" && (
                    <button 
                      onClick={() => handleCheckIn(booking._id, "confirmed")} 
                      className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                    >
                      <FaUserCheck size={11}/> Check In
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT - Bed Management Panel */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-extrabold text-headingColor text-base pb-3 border-b border-gray-100 flex items-center gap-2"><FaBed className="text-primaryColor"/> Bed Capacity Manager</h3>
          
          <form onSubmit={handleBedUpdate} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-headingColor block mb-1.5 uppercase tracking-wide">Available General Beds</label>
              <input 
                type="number" 
                required 
                placeholder="Count" 
                className="w-full px-3 py-2 border rounded-lg text-xs" 
                value={beds.availableBeds} 
                onChange={(e) => setBeds({...beds, availableBeds: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-headingColor block mb-1.5 uppercase tracking-wide">Available ICU Beds</label>
              <input 
                type="number" 
                required 
                placeholder="Count" 
                className="w-full px-3 py-2 border rounded-lg text-xs" 
                value={beds.availableIcuBeds} 
                onChange={(e) => setBeds({...beds, availableIcuBeds: parseInt(e.target.value) || 0})}
              />
            </div>
            <button 
              type="submit" 
              disabled={bedUpdateLoading} 
              className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex justify-center items-center"
            >
              {bedUpdateLoading ? <HashLoader size={16} color="#fff" /> : "Save Availability"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
