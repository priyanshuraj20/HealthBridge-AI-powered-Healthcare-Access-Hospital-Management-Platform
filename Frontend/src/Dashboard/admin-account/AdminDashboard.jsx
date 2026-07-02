import { useState, useEffect, useContext } from "react";
import { authContext } from "../../context/AuthContext.jsx";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import useFetchData from "../../hooks/useFetchData.js";
import Loading from "../../components/Loader/Loading.jsx";
import Error from "../../components/Error/Error.jsx";
import {
  AiOutlineUser,
  AiOutlineCalendar,
  AiOutlineMail,
  AiOutlineUserAdd,
  AiOutlinePieChart,
} from "react-icons/ai";
import { FaUserDoctor } from "react-icons/fa6";
import { RiMoneyDollarCircleLine } from "react-icons/ri";

const AdminDashboard = () => {
  const { user, dispatch } = useContext(authContext);
  const [activeTab, setActiveTab] = useState("overview");

  // State lists
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [messages, setMessages] = useState([]);

  // Fetch stats and lists
  const { data: apptData, loading: loadingAppts, error: errAppts } = useFetchData(`${BASE_URL}/bookings/allAppointments`);
  const { data: docData, loading: loadingDocs, error: errDocs } = useFetchData(`${BASE_URL}/doctors/all`);
  const { data: patData, loading: loadingPats, error: errPats } = useFetchData(`${BASE_URL}/users`);
  const { data: msgData, loading: loadingMsgs, error: errMsgs } = useFetchData(`${BASE_URL}/messages`);

  useEffect(() => {
    if (apptData) setAppointments(apptData);
  }, [apptData]);

  useEffect(() => {
    if (docData) setDoctors(docData);
  }, [docData]);

  useEffect(() => {
    if (patData) setPatients(patData);
  }, [patData]);

  useEffect(() => {
    if (msgData) setMessages(msgData);
  }, [msgData]);

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
        setAppointments((prev) =>
          prev.map((app) =>
            app._id === appointmentId ? { ...app, status: newStatus } : app
          )
        );
        toast.success(`Status updated to ${newStatus}`);
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred while updating status");
    }
  };

  const handleDoctorApproval = async (doctorId, status) => {
    try {
      const response = await fetch(`${BASE_URL}/doctors/updateStatus/${doctorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isApproved: status }),
      });

      const data = await response.json();
      if (response.ok) {
        setDoctors((prev) =>
          prev.map((doc) =>
            doc._id === doctorId ? { ...doc, isApproved: status } : doc
          )
        );
        toast.success(`Doctor status updated to ${status}`);
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred while updating doctor approval");
    }
  };

  // Add new admin promotion handler
  const [adminForm, setAdminForm] = useState({ name: "", email: "" });
  const [adminLoading, setAdminLoading] = useState(false);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/addAdmin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(adminForm),
      });

      const result = await res.json();
      setAdminLoading(false);

      if (!res.ok) {
        throw new Error(result.message);
      }

      toast.success(result.message || "User promoted to admin successfully");
      setAdminForm({ name: "", email: "" });
    } catch (err) {
      toast.error(err.message);
      setAdminLoading(false);
    }
  };

  // Calculate revenue (dummy/aggregate ticketPrice logic)
  const totalRevenue = appointments
    .filter((app) => app.isPaid)
    .reduce((acc, curr) => acc + (curr.ticketPrice || 0), 0);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    toast.success("Successfully logged out");
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 bg-white p-6 shadow-md rounded-lg h-fit border border-gray-100">
          <div className="text-center pb-6 border-b border-gray-100">
            <figure className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 border-2 border-primaryColor">
              <img
                src={user?.photo || "https://res.cloudinary.com/default-avatar.png"}
                alt=""
                className="w-full h-full object-cover"
              />
            </figure>
            <h4 className="text-lg font-bold text-headingColor">{user?.name}</h4>
            <p className="text-sm text-textColor italic">System Administrator</p>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-md transition-all ${
                activeTab === "overview"
                  ? "bg-primaryColor text-white"
                  : "text-headingColor hover:bg-gray-50"
              }`}
            >
              <AiOutlinePieChart size={18} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-md transition-all ${
                activeTab === "appointments"
                  ? "bg-primaryColor text-white"
                  : "text-headingColor hover:bg-gray-50"
              }`}
            >
              <AiOutlineCalendar size={18} />
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("doctors")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-md transition-all ${
                activeTab === "doctors"
                  ? "bg-primaryColor text-white"
                  : "text-headingColor hover:bg-gray-50"
              }`}
            >
              <FaUserDoctor size={18} />
              Doctors Portal
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-md transition-all ${
                activeTab === "patients"
                  ? "bg-primaryColor text-white"
                  : "text-headingColor hover:bg-gray-50"
              }`}
            >
              <AiOutlineUser size={18} />
              Patients Portal
            </button>
            <button
              onClick={() => setActiveTab("add-admin")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-md transition-all ${
                activeTab === "add-admin"
                  ? "bg-primaryColor text-white"
                  : "text-headingColor hover:bg-gray-50"
              }`}
            >
              <AiOutlineUserAdd size={18} />
              Add Administrator
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-md transition-all ${
                activeTab === "messages"
                  ? "bg-primaryColor text-white"
                  : "text-headingColor hover:bg-gray-50"
              }`}
            >
              <AiOutlineMail size={18} />
              Feedback Messages
            </button>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <button
              onClick={handleLogout}
              className="w-full bg-[#181A1E] text-white py-2 rounded-md hover:bg-black transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-white p-6 shadow-md rounded-lg border border-gray-100">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div>
              <h3 className="text-xl font-bold text-headingColor mb-6">System Dashboard</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-500">Total Bookings</span>
                    <AiOutlineCalendar className="text-blue-500" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-headingColor">{appointments.length}</h2>
                </div>
                <div className="p-5 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-500">Gross Revenue</span>
                    <RiMoneyDollarCircleLine className="text-green-500" size={22} />
                  </div>
                  <h2 className="text-2xl font-bold text-headingColor">{totalRevenue} INR</h2>
                </div>
                <div className="p-5 bg-purple-50 border border-purple-100 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-500">Doctors</span>
                    <FaUserDoctor className="text-purple-500" size={18} />
                  </div>
                  <h2 className="text-2xl font-bold text-headingColor">{doctors.length}</h2>
                </div>
                <div className="p-5 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-500">Patients</span>
                    <AiOutlineUser className="text-amber-500" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-headingColor">{patients.length}</h2>
                </div>
              </div>

              {/* Analytics Dummy Graph Container */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 mb-8">
                <h4 className="font-semibold text-headingColor mb-4">Patient Traffic & Revenue Trend</h4>
                <div className="h-48 flex items-end justify-between gap-2 pt-4">
                  {[45, 60, 55, 75, 90, 80, 110, 95, 120, 130, 140, 155].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        style={{ height: `${(val / 160) * 100}%` }}
                        className="w-full bg-primaryColor rounded-t hover:opacity-85 transition-all cursor-pointer"
                      ></div>
                      <span className="text-[10px] text-textColor mt-2">
                        {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === "appointments" && (
            <div>
              <h3 className="text-xl font-bold text-headingColor mb-6">Manage Appointments</h3>
              {loadingAppts && <Loading />}
              {errAppts && <Error errMsg={errAppts} />}
              {!loadingAppts && !errAppts && appointments.length === 0 && (
                <p className="text-textColor">No appointments registered in the system.</p>
              )}
              {!loadingAppts && !errAppts && appointments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-headingColor uppercase text-[12px] border-b">
                      <tr>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Doctor</th>
                        <th className="py-3 px-4">Date & Slot</th>
                        <th className="py-3 px-4">Paid</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {appointments.map((app) => (
                        <tr key={app._id} className="hover:bg-gray-50 text-textColor">
                          <td className="py-3 px-4 font-medium text-headingColor">
                            {app.user?.name || "Deleted User"}
                          </td>
                          <td className="py-3 px-4">Dr. {app.doctor?.name || "Deleted Doctor"}</td>
                          <td className="py-3 px-4">
                            {app.appointmentDate} <br />
                            <span className="text-xs text-gray-400">
                              {app.timeSlot?.startingTime} - {app.timeSlot?.endingTime} ({app.timeSlot?.day})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {app.isPaid ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Yes
                              </span>
                            ) : (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                No
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app._id, e.target.value)}
                              className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-primaryColor bg-white"
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Doctors Tab */}
          {activeTab === "doctors" && (
            <div>
              <h3 className="text-xl font-bold text-headingColor mb-6">Manage Doctor Listings</h3>
              {loadingDocs && <Loading />}
              {errDocs && <Error errMsg={errDocs} />}
              {!loadingDocs && !errDocs && doctors.length === 0 && (
                <p className="text-textColor">No doctors found.</p>
              )}
              {!loadingDocs && !errDocs && doctors.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-headingColor uppercase text-[12px] border-b">
                      <tr>
                        <th className="py-3 px-4">Doctor</th>
                        <th className="py-3 px-4">Specialization</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Approval status</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {doctors.map((doc) => (
                        <tr key={doc._id} className="hover:bg-gray-50 text-textColor">
                          <td className="py-3 px-4 font-medium text-headingColor flex items-center gap-3">
                            <img
                              src={doc.photo || "https://res.cloudinary.com/default-avatar.png"}
                              alt=""
                              className="w-10 h-10 object-cover rounded-full"
                            />
                            {doc.name}
                          </td>
                          <td className="py-3 px-4">{doc.specialization || "N/A"}</td>
                          <td className="py-3 px-4">{doc.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                doc.isApproved === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : doc.isApproved === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {doc.isApproved || "pending"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {doc.isApproved !== "approved" && (
                                <button
                                  onClick={() => handleDoctorApproval(doc._id, "approved")}
                                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                                >
                                  Approve
                                </button>
                              )}
                              {doc.isApproved !== "rejected" && (
                                <button
                                  onClick={() => handleDoctorApproval(doc._id, "rejected")}
                                  className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                                >
                                  Reject
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
          )}

          {/* Patients Tab */}
          {activeTab === "patients" && (
            <div>
              <h3 className="text-xl font-bold text-headingColor mb-6">Registered Patients</h3>
              {loadingPats && <Loading />}
              {errPats && <Error errMsg={errPats} />}
              {!loadingPats && !errPats && patients.length === 0 && (
                <p className="text-textColor">No patients registered.</p>
              )}
              {!loadingPats && !errPats && patients.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-headingColor uppercase text-[12px] border-b">
                      <tr>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Gender</th>
                        <th className="py-3 px-4">Blood Group</th>
                        <th className="py-3 px-4">Emergency Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {patients.map((pat) => (
                        <tr key={pat._id} className="hover:bg-gray-50 text-textColor">
                          <td className="py-3 px-4 font-medium text-headingColor flex items-center gap-3">
                            <img
                              src={pat.photo || "https://res.cloudinary.com/default-avatar.png"}
                              alt=""
                              className="w-10 h-10 object-cover rounded-full"
                            />
                            {pat.name}
                          </td>
                          <td className="py-3 px-4">{pat.email}</td>
                          <td className="py-3 px-4 uppercase">{pat.gender || "N/A"}</td>
                          <td className="py-3 px-4">{pat.bloodGroup || "N/A"}</td>
                          <td className="py-3 px-4 text-xs">
                            {pat.emergencyContact?.name ? (
                              <span>
                                {pat.emergencyContact.name} ({pat.emergencyContact.relationship}) <br />
                                {pat.emergencyContact.phone}
                              </span>
                            ) : (
                              "None"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add New Admin Tab */}
          {activeTab === "add-admin" && (
            <div className="max-w-[450px] mx-auto py-8">
              <h3 className="text-xl font-bold text-headingColor mb-6 text-center">Promote User to Admin</h3>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-headingColor block mb-1">Username / Name</label>
                  <input
                    type="text"
                    required
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primaryColor text-sm text-textColor"
                    placeholder="Enter full username"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-headingColor block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primaryColor text-sm text-textColor"
                    placeholder="Enter registered email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full bg-primaryColor text-white py-2 rounded-md font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center"
                >
                  {adminLoading ? "Promoting..." : "Add Admin"}
                </button>
              </form>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div>
              <h3 className="text-xl font-bold text-headingColor mb-6">User Inquiry Messages</h3>
              {loadingMsgs && <Loading />}
              {errMsgs && <Error errMsg={errMsgs} />}
              {!loadingMsgs && !errMsgs && messages.length === 0 && (
                <p className="text-textColor">No inquiry messages found.</p>
              )}
              {!loadingMsgs && !errMsgs && messages.length > 0 && (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className="p-5 border border-gray-100 rounded-lg hover:shadow-sm transition-all bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-headingColor">{msg.name}</h4>
                          <span className="text-xs text-primaryColor font-medium">{msg.email}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-headingColor mt-2">Subject: {msg.subject}</p>
                      <p className="text-sm text-textColor mt-1 italic">&ldquo;{msg.message}&rdquo;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
