import { useState } from "react";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { FaFileMedical, FaRobot, FaUpload, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import uploadImageToCloudinary from "../../utils/uploadCloudinary.js";

const PrescriptionOCR = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const token = localStorage.getItem("token");

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setOcrResult(null);
    try {
      const data = await uploadImageToCloudinary(file);
      setPreviewUrl(data.url);
      setSelectedFile(data.url);
      
      // Perform OCR processing
      const res = await fetch(`${BASE_URL}/ai/scan-prescription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: data.url })
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Failed to analyze prescription");
      
      setOcrResult(resData.data);
      toast.success("Prescription analyzed successfully!");
    } catch (err) {
      toast.error(err.message || "Something went wrong during scan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-8">
      <div>
        <h3 className="text-lg font-extrabold text-headingColor">AI Prescription OCR Scanner</h3>
        <p className="text-xs text-textColor mt-1">Upload a photo of your prescription to extract medicines, dosage instructions, and setup daily reminders automatically.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Upload Container */}
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl hover:border-primaryColor hover:bg-teal-50/5 transition-all relative">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileInputChange}
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-teal-50 text-primaryColor rounded-full flex items-center justify-center text-xl">
              {loading ? <HashLoader size={20} color="#0d9488" /> : <FaUpload />}
            </div>
            <div>
              <p className="text-xs font-bold text-headingColor">
                {loading ? "Scanning & Extracting Prescription Details..." : "Upload Prescription Image"}
              </p>
              <p className="text-[10px] text-textColor mt-1">PNG, JPG, or JPEG up to 10MB</p>
            </div>
          </div>
        </div>

        {/* Selected Image Preview */}
        {previewUrl && (
          <div className="flex flex-col items-center border border-gray-100 rounded-xl p-4 bg-gray-50/50">
            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider mb-2">Uploaded Document</span>
            <figure className="max-w-[200px] border rounded-lg overflow-hidden shadow-sm">
              <img src={previewUrl} alt="Prescription" className="w-full object-contain" />
            </figure>
          </div>
        )}

        {/* OCR Result View */}
        {ocrResult && (
          <div className="pt-6 border-t border-gray-100 space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-headingColor">
              <FaRobot className="text-primaryColor" />
              <span>Extracted Prescription Details</span>
            </div>

            <div className="space-y-4">
              {ocrResult.medicines && ocrResult.medicines.map((med, idx) => (
                <div key={idx} className="bg-teal-50/20 border border-teal-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-headingColor text-sm">{med.name}</h4>
                      <p className="text-xs text-textColor mt-0.5">
                        <span className="font-semibold">Dosage:</span> {med.dosage} | <span className="font-semibold">Frequency:</span> {med.frequency}
                      </p>
                    </div>
                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                      <FaCheckCircle /> Parsed
                    </span>
                  </div>

                  <p className="text-xs text-textColor border-t border-dashed border-teal-100/50 pt-2 leading-5">
                    <span className="font-semibold text-headingColor">Indication:</span> {med.explanation}
                  </p>

                  {med.reminders && med.reminders.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Reminders:</span>
                      {med.reminders.map((time, tIdx) => (
                        <span key={tIdx} className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ⏰ {time}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionOCR;
