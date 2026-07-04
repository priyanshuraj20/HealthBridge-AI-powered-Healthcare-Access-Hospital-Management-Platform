import { useState } from "react";
import useFetchData from "../../hooks/useFetchData";
import { BASE_URL } from "../../config";
import Loading from "../../components/Loader/Loading";
import Error from "../../components/Error/Error.jsx";
import { toast } from "react-toastify";
import uploadImageToCloudinary from "../../utils/uploadCloudinary";

const MedicalReports = () => {
  const {
    data: reports,
    loading,
    error,
  } = useFetchData(`${BASE_URL}/reports`);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    fileUrl: "",
    fileType: "image",
    findings: "", // optional text findings for AI summarizer
  });

  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const data = await uploadImageToCloudinary(file);
      const isPdf = file.type === "application/pdf";
      setFormData((prev) => ({
        ...prev,
        fileUrl: data.url,
        fileType: isPdf ? "pdf" : "image",
      }));
      toast.success("File uploaded to Cloudinary successfully!");
    } catch (err) {
      toast.error("Failed to upload file to Cloudinary.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.fileUrl) {
      toast.error("Please enter a title and upload a file first.");
      return;
    }

    setUploadLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: formData.title,
          fileUrl: formData.fileUrl,
          fileType: formData.fileType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Medical report registered successfully!");
      setFormData({ title: "", fileUrl: "", fileType: "image", findings: "" });
      // Reload lists
      window.location.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const fetchSummary = async (reportTitle, findingsText) => {
    if (!findingsText) {
      toast.error("Please provide/paste the report findings text to summarize.");
      return;
    }

    setAiLoading(true);
    setAiSummary("AI Specialist is summarizing findings in simple terms...");
    try {
      const res = await fetch(`${BASE_URL}/ai/report-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: reportTitle,
          reportText: findingsText,
        }),
      });

      const data = await res.json();
      setAiLoading(false);
      if (!res.ok) throw new Error(data.message);

      setAiSummary(data.summary);
    } catch (err) {
      toast.error(err.message);
      setAiLoading(false);
      setAiSummary(null);
    }
  };

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Upload Panel */}
      <div className="lg:col-span-1 bg-white p-5 border border-gray-100 rounded-lg shadow-sm h-fit">
        <h4 className="font-bold text-headingColor mb-4">Upload Medical Report</h4>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-headingColor block mb-1">
              Report Title / Description *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded text-xs text-textColor focus:outline-none focus:border-primaryColor"
              placeholder="e.g. Blood Test, Chest X-Ray"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-headingColor block mb-1">
              Upload PDF or Image *
            </label>
            <input
              type="file"
              required
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="w-full text-xs text-textColor cursor-pointer"
            />
            {uploadLoading && <span className="text-[10px] text-primaryColor font-medium">Uploading file...</span>}
            {formData.fileUrl && (
              <p className="text-[10px] text-green-600 font-semibold mt-1">
                File loaded: {formData.fileType.toUpperCase()} Format
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-headingColor block mb-1">
              Report Findings Text (Optional, for AI interpretation)
            </label>
            <textarea
              value={formData.findings}
              onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
              className="w-full p-2.5 border rounded text-xs text-textColor focus:outline-none focus:border-primaryColor"
              placeholder="Paste text findings here (e.g. Hemoglobin 14.2 g/dL, normal range...)"
              rows="3"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={uploadLoading || !formData.fileUrl}
            className="btn w-full rounded-md text-xs py-2 font-semibold"
          >
            Save Report
          </button>
        </form>
      </div>

      {/* Reports List */}
      <div className="lg:col-span-2">
        <h4 className="font-bold text-headingColor mb-4">My Reports Folder</h4>
        {loading && !error && <Loading />}
        {error && !loading && <Error errMsg={error} />}
        {!loading && !error && reports?.length === 0 && (
          <p className="text-textColor">No medical reports found. Upload your reports to store them securely.</p>
        )}
        {!loading && !error && reports?.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white p-5 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-bold text-headingColor">{report.title}</h5>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-semibold">
                      {report.fileType}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(report.uploadedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-textColor px-3 py-1.5 rounded font-semibold"
                  >
                    View File
                  </a>
                  {formData.findings && (
                    <button
                      onClick={() => fetchSummary(report.title, formData.findings)}
                      className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-semibold"
                    >
                      AI Report Summary
                    </button>
                  )}
                  {/* If they didn't write findings, let them input and interpret */}
                  {!formData.findings && (
                    <button
                      onClick={() => {
                        const input = window.prompt("Please paste the findings text from the report to summarize:");
                        if (input) fetchSummary(report.title, input);
                      }}
                      className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-semibold"
                    >
                      AI Report Interpretation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Summary Modal */}
      {aiSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-[550px] max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-headingColor mb-3">AI Medical Report Interpretation</h4>
            <div className="text-sm text-textColor space-y-4 bg-gray-50 p-4 rounded border border-gray-100 whitespace-pre-wrap leading-6">
              {aiSummary}
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setAiSummary(null)}
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

export default MedicalReports;
