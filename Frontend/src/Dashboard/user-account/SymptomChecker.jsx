import { useState } from "react";
import { BASE_URL } from "../../config";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { AiOutlineCheckCircle, AiOutlineWarning } from "react-icons/ai";

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast.error("Please enter some symptoms first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/ai/symptom-checker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      const data = await res.json();
      setLoading(false);
      if (!res.ok) throw new Error(data.message);

      setResult(data.data);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-white p-6 border border-gray-100 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold text-headingColor mb-4">AI Symptom Checker</h3>
      <p className="text-sm text-textColor mb-6">
        Enter your symptoms below. Our AI triage assistant will recommend the appropriate department and urgency level.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            required
            rows="4"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full p-4 border rounded focus:outline-none focus:border-primaryColor text-textColor text-sm"
            placeholder="e.g. Cough for 3 days, mild fever, sore throat..."
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn rounded-md px-6 py-2.5 font-semibold text-sm hover:opacity-95 transition-all flex items-center justify-center"
        >
          {loading ? <HashLoader size={20} color="#fff" /> : "Check Symptoms"}
        </button>
      </form>

      {result && (
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recommendations & Urgency */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-gray-400 block mb-1">
                  Urgency Level
                </span>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    result.urgency === "High"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : result.urgency === "Medium"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      : "bg-green-100 text-green-700 border border-green-200"
                  }`}
                >
                  <AiOutlineWarning size={14} />
                  {result.urgency}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-gray-400 block mb-1">
                  Recommended Departments
                </span>
                <div className="flex gap-2 flex-wrap">
                  {result.departments?.map((dept, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-semibold"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Guidance Text */}
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg">
              <span className="text-xs font-bold uppercase text-gray-400 block mb-1">
                Triage Explanation
              </span>
              <p className="text-sm text-textColor leading-6">{result.recommendation}</p>
            </div>
          </div>

          {/* Disclaimer Alert */}
          {result.disclaimer && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex items-start gap-3">
              <span className="mt-0.5">
                <AiOutlineCheckCircle className="text-red-500" size={16} />
              </span>
              <p className="leading-5">{result.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
