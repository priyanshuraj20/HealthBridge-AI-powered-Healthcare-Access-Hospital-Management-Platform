import { useState, useEffect } from "react";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import uploadImageToCloudinary from "../../utils/uploadCloudinary.js";
import { FaFlask, FaFileUpload, FaCheckCircle, FaUserInjured } from "react-icons/fa";

export default function LabTechPanel() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reportForm, setReportForm] = useState({ name: "", fileUrl: "" });
  
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchId = user.hospital; // Staff's linked branch

  const fetchOrders = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/hospitals/${branchId}/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Filter bookings that have prescribed tests
        const testOrders = (data.data || []).filter(b => b.prescribedTests && b.prescribedTests.length > 0);
        setOrders(testOrders);
      }
    } catch (err) {
      toast.error("Failed to load lab orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [branchId]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadImageToCloudinary(file);
      setReportForm({ ...reportForm, fileUrl: data.url });
      toast.success("Document uploaded to secure vault");
    } catch (err) {
      toast.error("File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.fileUrl) {
      toast.error("Please upload the lab report file first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/upload-reports/${selectedOrder._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(reportForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Report successfully processed and assigned to patient file!");
      setSelectedOrder(null);
      setReportForm({ name: "", fileUrl: "" });
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to process report");
    } finally {
      setLoading(false);
    }
  };

  if (!branchId) {
    return (
      <div className="container max-w-[800px] mx-auto py-20 text-center text-textColor">
        <FaFlask size={40} className="mx-auto mb-3 text-red-400" />
        <p className="font-semibold text-lg font-mono">Lab Branch Mapping Missing</p>
        <p className="text-xs mt-1">Please ensure your account is registered under a valid Hospital Branch.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-[1200px] mx-auto px-4 py-10 min-h-[85vh]">
      <div className="border-b pb-6 mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-headingColor">Lab Pathology & Diagnostics Board</h2>
          <p className="text-xs text-textColor mt-1">Process test requests, view physician orders, and upload reports directly into patient vaults</p>
        </div>
        <button onClick={fetchOrders} className="border border-gray-300 text-xs font-semibold px-4 py-2 hover:bg-gray-50 rounded-lg">
          Refresh Orders
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT - Pending Orders List */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-extrabold text-headingColor text-base mb-3 flex items-center gap-2"><FaFlask className="text-primaryColor"/> Prescribed Lab Orders</h3>

          {loading && !uploading ? (
            <div className="flex justify-center py-20"><HashLoader color="#0d9488" /></div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-textColor">
              <p className="font-bold">No active lab orders</p>
              <p className="text-xs mt-1">Physicians have not ordered any diagnostic tests at this branch today.</p>
            </div>
          ) : (
            orders.map(order => (
              <div 
                key={order._id} 
                onClick={() => setSelectedOrder(order)}
                className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center cursor-pointer ${
                  selectedOrder?._id === order._id ? "border-primaryColor/60 bg-teal-50/10" : "border-gray-200"
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-headingColor text-sm">{order.patient?.name}</h4>
                  <p className="text-[11px] text-textColor mt-1 font-medium">Doctor: <span className="font-semibold">{order.doctor?.name}</span></p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {order.prescribedTests?.split(",").map(t => (
                      <span key={t} className="bg-teal-50 border border-teal-200 text-teal-700 text-[9px] font-bold px-2 py-0.5 rounded-full">{t.trim()}</span>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">{order.appointmentDate}</span>
              </div>
            ))
          )}
        </div>

        {/* RIGHT - Report Upload Panel */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-headingColor text-base pb-3 border-b border-gray-100 flex items-center gap-2"><FaFileUpload className="text-primaryColor"/> Process Diagnostic File</h3>
          
          {selectedOrder ? (
            <form onSubmit={handleReportSubmit} className="space-y-4 pt-3">
              <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl">
                <p className="text-xs text-textColor">Uploading For:</p>
                <p className="text-sm font-extrabold text-headingColor mt-0.5">{selectedOrder.patient?.name}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wide">Ordered Tests: {selectedOrder.prescribedTests}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-headingColor block mb-1.5 uppercase tracking-wide">Test/Report Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Complete Blood Count (CBC)" 
                  className="w-full px-3 py-2.5 border rounded-lg text-xs" 
                  value={reportForm.name} 
                  onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-headingColor block mb-1.5 uppercase tracking-wide">Report Document</label>
                <div className="relative">
                  <input 
                    type="file" 
                    required={!reportForm.fileUrl}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 hover:border-primaryColor rounded-xl cursor-pointer bg-gray-50 hover:bg-teal-50/5 text-center transition-all">
                    {uploading ? (
                      <HashLoader size={20} color="#0d9488" />
                    ) : reportForm.fileUrl ? (
                      <div className="space-y-1">
                        <FaCheckCircle className="text-green-600 mx-auto text-lg"/>
                        <p className="text-xs text-green-700 font-bold">Document Uploaded Successfully</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-textColor">
                        <FaFileUpload className="mx-auto text-lg text-gray-400"/>
                        <p className="text-xs font-semibold">Click to upload report image or PDF</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || uploading} 
                className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex justify-center items-center"
              >
                {loading ? <HashLoader size={16} color="#fff" /> : "Save to Patient Vault"}
              </button>
            </form>
          ) : (
            <div className="text-center py-10 text-textColor">
              <FaUserInjured size={32} className="mx-auto mb-2 text-gray-300"/>
              <p className="text-xs font-bold">Select a patient order from the list on the left to start processing their lab report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
