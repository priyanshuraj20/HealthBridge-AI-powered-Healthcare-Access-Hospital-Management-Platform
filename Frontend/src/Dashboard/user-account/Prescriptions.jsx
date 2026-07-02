import { useState } from "react";
import useFetchData from "../../hooks/useFetchData";
import { BASE_URL } from "../../config";
import Loading from "../../components/Loader/Loading";
import Error from "../../components/Error/Error.jsx";
import { toast } from "react-toastify";

const Prescriptions = () => {
  const {
    data: prescriptions,
    loading,
    error,
  } = useFetchData(`${BASE_URL}/prescriptions`);

  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchExplanation = async (prescription) => {
    setAiLoading(true);
    setAiExplanation("Pharmacist AI is analyzing your medicines, dosages, and instructions...");
    try {
      const res = await fetch(`${BASE_URL}/ai/prescription-explanation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          medicines: prescription.medicines,
          notes: prescription.notes,
        }),
      });

      const data = await res.json();
      setAiLoading(false);
      if (!res.ok) throw new Error(data.message);

      setAiExplanation(data.explanation);
    } catch (err) {
      toast.error(err.message);
      setAiLoading(false);
      setAiExplanation(null);
    }
  };

  const downloadPdf = (prescription) => {
    const printWindow = window.open("", "_blank");
    const medicinesHtml = prescription.medicines
      .map(
        (m) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; color: #111;">${m.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${m.dosage}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${m.duration}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-style: italic; color: #555;">${m.instructions || "-"}</td>
        </tr>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - Dr. ${prescription.doctor?.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 26px; font-weight: bold; color: #0d9488; letter-spacing: 0.5px; }
            .details { margin-bottom: 35px; line-height: 1.6; display: flex; justify-content: space-between; background: #f8f9fa; padding: 15px; rounded-md; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #0d9488; color: white; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
            .footer { margin-top: 60px; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">HEALTHBRIDGE ACCESS PORTAL</div>
              <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">123 Medical Health Way, Care City</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #0d9488;">Rx PRESCRIPTION</h2>
              <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">Date: ${new Date(prescription.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="details">
            <div>
              <p style="margin: 4px 0;"><strong>Doctor:</strong> Dr. ${prescription.doctor?.name}</p>
              <p style="margin: 4px 0;"><strong>Specialization:</strong> ${prescription.doctor?.specialization || "General Medicine"}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 4px 0;"><strong>Patient:</strong> ${prescription.user?.name}</p>
              <p style="margin: 4px 0;"><strong>Email:</strong> ${prescription.user?.email}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${medicinesHtml}
            </tbody>
          </table>

          ${prescription.notes ? `<div style="margin-top: 40px; padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b;"><strong style="color: #b45309;">Additional Notes:</strong><p style="margin: 6px 0 0 0; line-height: 1.5;">${prescription.notes}</p></div>` : ""}

          <div class="footer">
            <p>This is an officially signed prescription from Medicare Portal. Please visit a certified pharmacy store to collect your drugs.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="mt-6">
      {loading && !error && <Loading />}
      {error && !loading && <Error errMsg={error} />}
      {!loading && !error && prescriptions?.length === 0 && (
        <p className="text-textColor">No prescriptions have been issued to you yet.</p>
      )}
      {!loading && !error && prescriptions?.length > 0 && (
        <div className="space-y-6">
          {prescriptions.map((prescription) => (
            <div
              key={prescription._id}
              className="bg-white p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-headingColor">
                    Dr. {prescription.doctor?.name || "Doctor"}
                  </h4>
                  <span className="text-xs text-primaryColor font-semibold uppercase">
                    {prescription.doctor?.specialization}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(prescription.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm font-bold text-headingColor">Prescribed Medicines:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-gray-50 rounded">
                    <thead className="bg-gray-50 text-headingColor">
                      <tr>
                        <th className="p-2 border-b">Medicine</th>
                        <th className="p-2 border-b">Dosage</th>
                        <th className="p-2 border-b">Duration</th>
                        <th className="p-2 border-b">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescription.medicines.map((med, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 text-textColor">
                          <td className="p-2 border-b font-semibold text-headingColor">{med.name}</td>
                          <td className="p-2 border-b">{med.dosage}</td>
                          <td className="p-2 border-b">{med.duration}</td>
                          <td className="p-2 border-b font-medium text-gray-500 italic">{med.instructions || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {prescription.notes && (
                  <p className="text-xs text-textColor bg-amber-50 p-2.5 rounded border border-amber-100 mt-3">
                    <span className="font-bold text-amber-800">Notes: </span>
                    {prescription.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => fetchExplanation(prescription)}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded"
                >
                  Explain Medicines (AI)
                </button>
                <button
                  onClick={() => downloadPdf(prescription)}
                  className="text-xs bg-primaryColor hover:opacity-90 text-white font-semibold px-4 py-2 rounded"
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Explanation Modal */}
      {aiExplanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-[550px] max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-headingColor mb-3">AI Pharmacist Explanation</h4>
            <div className="text-sm text-textColor space-y-4 bg-gray-50 p-4 rounded border border-gray-100 whitespace-pre-wrap leading-6">
              {aiExplanation}
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setAiExplanation(null)}
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

export default Prescriptions;
