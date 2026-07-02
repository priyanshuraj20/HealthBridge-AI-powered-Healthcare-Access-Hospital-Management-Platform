import { useState } from "react";
import { BASE_URL } from "../../config";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import {
  AiOutlineLineChart,
  AiOutlineInsurance,
  AiOutlineFileText,
  AiOutlineNodeIndex,
} from "react-icons/ai";

const HealthBridgeAI = () => {
  const [activeGuide, setActiveGuide] = useState("financial");

  // Input states
  const [query, setQuery] = useState("");
  const [treatment, setTreatment] = useState("");
  const [costQuote, setCostQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const handleAiQuery = async (e) => {
    e.preventDefault();
    if (!query && activeGuide !== "cost") {
      toast.error("Please enter a question.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to query AI guides.");
      return;
    }

    setLoading(true);
    setAiResponse("Analyzing details and preparing expert medical guidance...");

    try {
      let endpoint = `${BASE_URL}/ai/financial-counsel`;
      let body = { query };

      if (activeGuide === "insurance") {
        endpoint = `${BASE_URL}/ai/insurance-guide`;
      } else if (activeGuide === "cost") {
        endpoint = `${BASE_URL}/ai/cost-explainer`;
        body = { treatmentName: treatment, cost: costQuote };
      } else if (activeGuide === "recommend") {
        endpoint = `${BASE_URL}/ai/hospital-recommend`;
        body = { query, preferredSpecialty: treatment };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) throw new Error(data.message);

      if (activeGuide === "cost") {
        setAiResponse(data.explanation);
      } else {
        setAiResponse(data.reply);
      }
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
      setAiResponse("Sorry, we are unable to reach the AI engine right now. Please try again.");
    }
  };

  return (
    <section className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-[960px] px-5 mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-headingColor">HealthBridge AI Guides</h2>
          <p className="text-textColor text-sm mt-2">
            Interact with our customized medical financial scribes and triage consultants.
          </p>
        </div>

        {/* Navigation grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 bg-white p-2 rounded-lg shadow-sm">
          <button
            onClick={() => {
              setActiveGuide("financial");
              setAiResponse("");
              setQuery("");
            }}
            className={`flex flex-col items-center justify-center p-4 text-center rounded transition-all ${
              activeGuide === "financial" ? "bg-primaryColor text-white" : "text-headingColor hover:bg-gray-50"
            }`}
          >
            <AiOutlineLineChart size={24} className="mb-2" />
            <span className="text-xs font-semibold">Financial Counsellor</span>
          </button>

          <button
            onClick={() => {
              setActiveGuide("insurance");
              setAiResponse("");
              setQuery("");
            }}
            className={`flex flex-col items-center justify-center p-4 text-center rounded transition-all ${
              activeGuide === "insurance" ? "bg-primaryColor text-white" : "text-headingColor hover:bg-gray-50"
            }`}
          >
            <AiOutlineInsurance size={24} className="mb-2" />
            <span className="text-xs font-semibold">Insurance Guide</span>
          </button>

          <button
            onClick={() => {
              setActiveGuide("cost");
              setAiResponse("");
              setQuery("");
            }}
            className={`flex flex-col items-center justify-center p-4 text-center rounded transition-all ${
              activeGuide === "cost" ? "bg-primaryColor text-white" : "text-headingColor hover:bg-gray-50"
            }`}
          >
            <AiOutlineFileText size={24} className="mb-2" />
            <span className="text-xs font-semibold">Cost Explainer</span>
          </button>

          <button
            onClick={() => {
              setActiveGuide("recommend");
              setAiResponse("");
              setQuery("");
            }}
            className={`flex flex-col items-center justify-center p-4 text-center rounded transition-all ${
              activeGuide === "recommend" ? "bg-primaryColor text-white" : "text-headingColor hover:bg-gray-50"
            }`}
          >
            <AiOutlineNodeIndex size={24} className="mb-2" />
            <span className="text-xs font-semibold">Recommendation Assistant</span>
          </button>
        </div>

        {/* Interactive Query Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-6">
          <h4 className="font-bold text-headingColor text-base border-b pb-3 capitalize">
            {activeGuide === "financial" && "AI Medical Financial Consultant"}
            {activeGuide === "insurance" && "AI Policy & Scheme Advisor"}
            {activeGuide === "cost" && "AI Treatment Bill Analyzer"}
            {activeGuide === "recommend" && "AI Hospital & Doctor Referral Assistant"}
          </h4>

          <form onSubmit={handleAiQuery} className="space-y-4">
            {activeGuide === "cost" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Treatment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Angioplasty, Hernia Repair"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    className="w-full p-2.5 border rounded text-xs text-textColor focus:outline-none focus:border-primaryColor"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Estimated Cost Quote (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 120000"
                    value={costQuote}
                    onChange={(e) => setCostQuote(e.target.value)}
                    className="w-full p-2.5 border rounded text-xs text-textColor focus:outline-none focus:border-primaryColor"
                  />
                </div>
              </div>
            )}

            {activeGuide === "recommend" && (
              <div>
                <label className="text-xs font-semibold text-headingColor block mb-1">Target Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, Orthopedics (Optional)"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="w-full p-2.5 border rounded text-xs text-textColor focus:outline-none focus:border-primaryColor mb-4"
                />
              </div>
            )}

            {activeGuide !== "cost" && (
              <div>
                <label className="text-xs font-semibold text-headingColor block mb-1">Describe your query / situation</label>
                <textarea
                  required
                  rows="3"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full p-2.5 border rounded text-xs text-textColor focus:outline-none focus:border-primaryColor"
                  placeholder={
                    activeGuide === "financial"
                      ? "Ask about loan EMIs, interest tenures, or out-of-pocket costs..."
                      : activeGuide === "insurance"
                      ? "Ask about PM-JAY eligibility, standard coverage copays, or networks..."
                      : "Describe what you need in a hospital (e.g. lowest cost for hernia surgery, shortest wait for cardiology)..."
                  }
                ></textarea>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn rounded px-6 py-2.5 font-semibold text-xs transition-all flex items-center justify-center"
            >
              {loading ? <HashLoader size={20} color="#fff" /> : "Consult AI Assistant"}
            </button>
          </form>

          {/* AI Response Display */}
          {aiResponse && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h5 className="font-bold text-headingColor text-xs uppercase mb-3 text-gray-400">AI Counselor Advice</h5>
              <div className="bg-gray-50 border p-5 rounded-lg text-sm text-textColor leading-6 whitespace-pre-wrap">
                {aiResponse}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HealthBridgeAI;
