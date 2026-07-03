import { useState, useEffect } from "react";
import { BASE_URL } from "../../config";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { 
  BiCalculator, BiShield, BiCheckCircle, BiDownload, 
  BiTrendingDown, BiMoney, BiInfoCircle, BiSearch 
} from "react-icons/bi";
import { FaHospital, FaStethoscope, FaFileInvoiceDollar, FaCapsules, FaPercent } from "react-icons/fa";

export default function AffordabilityHub() {
  // Assessment input states
  const [treatment, setTreatment] = useState("Appendix Surgery");
  const [insurance, setInsurance] = useState("Star Health");
  const [income, setIncome] = useState("120000");
  const [familySize, setFamilySize] = useState("4");
  
  // Assessment outputs states
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  // Medicine savings states
  const [medQuery, setMedQuery] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);

  // Medical loan states
  const [loanAmount, setLoanAmount] = useState(50000);
  const [loanTenure, setLoanTenure] = useState(12);
  const [loanResult, setLoanResult] = useState(null);
  const [submittingLoan, setSubmittingLoan] = useState(false);

  // Initial loads
  useEffect(() => {
    fetchMedicines();
    calculateLoanEMI();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMedicines();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [medQuery]);

  useEffect(() => {
    calculateLoanEMI();
  }, [loanAmount, loanTenure]);

  const fetchMedicines = async () => {
    setLoadingMeds(true);
    try {
      const res = await fetch(`${BASE_URL}/pharmacy/medicines?query=${medQuery}`);
      const json = await res.json();
      if (res.ok) {
        setMedicines(json.data || []);
      }
    } catch (e) {
      console.log("Pharmacy fetch error:", e.message);
    } finally {
      setLoadingMeds(false);
    }
  };

  const calculateLoanEMI = () => {
    // 10% flat interest rate calculation
    const principal = parseFloat(loanAmount);
    const months = parseInt(loanTenure);
    const rate = 0.10; // 10% per annum
    const totalInterest = principal * rate * (months / 12);
    const totalRepayable = principal + totalInterest;
    const emi = totalRepayable / months;

    setLoanResult({
      emi: Math.round(emi),
      interest: Math.round(totalInterest),
      total: Math.round(totalRepayable)
    });
  };

  const handleRunAssessment = async (e) => {
    e.preventDefault();
    setAssessmentLoading(true);
    setAssessmentResult(null);

    try {
      // 1. Predict costs across hospitals
      const costRes = await fetch(`${BASE_URL}/affordability/predict-costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentName: treatment,
          insuranceProvider: insurance,
        }),
      });
      const costJson = await costRes.json();

      // 2. Check Ayushman Bharat (PM-JAY) eligibility
      const pmjayRes = await fetch(`${BASE_URL}/affordability/eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId: "pmjay",
          income: income,
          familySize: familySize,
        }),
      });
      const pmjayJson = await pmjayRes.json();

      if (costRes.ok && pmjayRes.ok) {
        setAssessmentResult({
          hospitals: costJson.data || [],
          pmjay: pmjayJson,
        });
        toast.success("Affordability assessment completed!");
      } else {
        toast.error("Failed to run assessment. Check inputs.");
      }
    } catch (err) {
      toast.error("Network error during assessment.");
    } finally {
      setAssessmentLoading(false);
    }
  };

  const handleApplyLoan = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Please login to submit a medical financing request.");
      return;
    }
    setSubmittingLoan(true);
    try {
      const res = await fetch(`${BASE_URL}/financial/loan-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestedAmount: loanAmount,
          tenureMonths: loanTenure,
          treatmentName: treatment || "General Surgery",
        })
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Medical financing request submitted! HMS team will contact you shortly.");
      } else {
        toast.error(json.message);
      }
    } catch (e) {
      toast.error("EMI request failed");
    } finally {
      setSubmittingLoan(false);
    }
  };

  const handleDownloadReport = () => {
    if (!assessmentResult) return;
    window.print();
  };

  // Find best hospital recommendation (lowest out of pocket)
  const recommendedHospital = assessmentResult?.hospitals?.reduce((best, curr) => {
    return (!best || curr.outOfPocket < best.outOfPocket) ? curr : best;
  }, null);

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-white border-b border-gray-100 py-12 shadow-sm">
        <div className="container max-w-[1200px] mx-auto px-4 text-center">
          <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-primaryColor bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-full mb-3">
            USP — Access & Affordability Toolkit
          </span>
          <h2 className="text-3xl font-extrabold text-headingColor">Healthcare Access & Affordability Hub</h2>
          <p className="text-textColor text-sm mt-2 max-w-[650px] mx-auto leading-relaxed">
            Compare clinical cost sheets side-by-side, estimate out-of-pocket expenses, verify PM-JAY eligibility, check generic medicine equivalents, and plan medical loans.
          </p>
        </div>
      </section>

      {/* Grid Layout */}
      <div className="container max-w-[1200px] mx-auto px-4 mt-10 space-y-10">
        
        {/* SECTION 1 — HEALTHCARE FINANCIAL CALCULATOR */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b pb-4 gap-3">
            <div className="flex items-center gap-2">
              <BiCalculator className="text-primaryColor text-xl" />
              <div>
                <h3 className="font-extrabold text-headingColor text-base">Smart Out-of-Pocket Cost Estimator</h3>
                <p className="text-[11px] text-textColor mt-0.5">Predict clinical costs, insurance co-pay, and PM-JAY schemes.</p>
              </div>
            </div>
            {assessmentResult && (
              <button
                onClick={handleDownloadReport}
                className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <BiDownload /> Download Cost Report
              </button>
            )}
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Inputs */}
            <form onSubmit={handleRunAssessment} className="lg:col-span-4 bg-gray-50 border border-gray-200 p-5 rounded-2xl space-y-4">
              <div>
                <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase">Select Treatment / Surgery</label>
                <select
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-xs text-textColor bg-white font-semibold"
                >
                  <option value="Appendix Surgery">Appendix Surgery</option>
                  <option value="Angioplasty">Angioplasty</option>
                  <option value="Hernia Surgery">Hernia Surgery</option>
                  <option value="Knee Replacement">Knee Replacement</option>
                  <option value="Cataract Operation">Cataract Operation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase">Select Insurance Provider</label>
                <select
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-xs text-textColor bg-white font-semibold"
                >
                  <option value="Star Health">Star Health</option>
                  <option value="HDFC Ergo">HDFC Ergo</option>
                  <option value="Max Bupa">Max Bupa</option>
                  <option value="None">Self-Pay / None</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase">Monthly Family Income (INR)</label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-xs text-headingColor bg-white font-semibold"
                  placeholder="e.g. 50000"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase">Household Family Size</label>
                <input
                  type="number"
                  value={familySize}
                  onChange={(e) => setFamilySize(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-xs text-headingColor bg-white font-semibold"
                  placeholder="e.g. 4"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={assessmentLoading}
                className="w-full btn rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/10"
              >
                {assessmentLoading ? <HashLoader size={16} color="#fff" /> : "Run Financial Assessment"}
              </button>
            </form>

            {/* Right Outputs */}
            <div className="lg:col-span-8 space-y-6">
              {!assessmentResult ? (
                <div className="text-center py-16 bg-gray-50 border border-dashed rounded-2xl text-textColor flex flex-col items-center justify-center space-y-3">
                  <span className="text-3xl">📊</span>
                  <h4 className="font-bold text-headingColor text-sm">Waiting for Assessment Parameters</h4>
                  <p className="text-xs max-w-sm leading-5">
                    Select surgery, income, and insurance variables on the left. Our toolkit will evaluate cost predictions, hospital listings, PM-JAY status, and AI recommendation rules.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Scheme eligibility alert banner */}
                  <div className={`p-4 border rounded-2xl flex items-center justify-between gap-3 shadow-sm ${
                    assessmentResult.pmjay?.eligible
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-gray-150 border-gray-200 text-textColor"
                  }`}>
                    <div className="flex items-center gap-2">
                      <BiShield size={20} className={assessmentResult.pmjay?.eligible ? "text-emerald-600" : "text-gray-500"} />
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wide">
                          {assessmentResult.pmjay?.eligible ? "Ayushman Bharat Covered" : "PM-JAY Eligibility Status"}
                        </h4>
                        <p className="text-[11px] leading-relaxed mt-0.5">
                          {assessmentResult.pmjay?.eligible 
                            ? "Congratulations! You are eligible for 100% Cashless PM-JAY national cover (up to 5 Lakhs)." 
                            : "Based on family income threshold limit, PM-JAY cashless cover is not applicable for this session."}
                        </p>
                      </div>
                    </div>
                    {assessmentResult.pmjay?.eligible && (
                      <span className="bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                        100% Cashless
                      </span>
                    )}
                  </div>

                  {/* Recommended Hospital & AI recommendation card */}
                  {recommendedHospital && (
                    <div className="bg-teal-50/20 border border-teal-150 rounded-2xl p-5 space-y-3 shadow-sm">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                        💡 AI Financial Advisor Recommendation
                      </h4>
                      <p className="text-xs text-headingColor leading-relaxed font-semibold">
                        Based on the assessment, we highly recommend <span className="text-primaryColor font-extrabold">{recommendedHospital.hospitalName}</span>.
                      </p>
                      <p className="text-xs text-textColor leading-relaxed">
                        The estimated out-of-pocket expense is the lowest here: <strong className="text-teal-700 font-extrabold">₹{recommendedHospital.outOfPocket.toLocaleString()}</strong>.
                        ({recommendedHospital.note})
                      </p>
                    </div>
                  )}

                  {/* Hospital Cost Comparison Grid */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-headingColor uppercase tracking-wider">Hospital Cost Comparison Sheet</h4>
                    <div className="overflow-x-auto border border-gray-100 rounded-2xl bg-white shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-headingColor uppercase tracking-wide font-bold">
                          <tr>
                            <th className="p-3 border-b">Hospital Branch</th>
                            <th className="p-3 border-b text-right">Total Package</th>
                            <th className="p-3 border-b text-right">Insurance Cover</th>
                            <th className="p-3 border-b text-right">Out-of-Pocket</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-textColor font-medium">
                          {assessmentResult.hospitals.map((h, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="p-3">
                                <p className="font-bold text-headingColor">{h.hospitalName}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">📍 {h.location} • {h.distance} km</p>
                              </td>
                              <td className="p-3 text-right font-semibold text-headingColor">₹{h.totalCost.toLocaleString()}</td>
                              <td className="p-3 text-right text-indigo-600 font-semibold">₹{h.estimatedCoverage.toLocaleString()}</td>
                              <td className="p-3 text-right text-teal-700 font-extrabold text-sm">₹{h.outOfPocket.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2 — MEDICINE PRICE SAVINGS ADVISOR */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3.5">
            <FaCapsules className="text-primaryColor" size={16} />
            <div>
              <h3 className="font-extrabold text-headingColor text-base">Healthcare Generic Medicine Savings Advisor</h3>
              <p className="text-[11px] text-textColor mt-0.5">Compare branded drugs with generic equivalents to save 80% or more.</p>
            </div>
          </div>

          <div className="max-w-[600px]">
            <div className="relative">
              <BiSearch className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
              <input
                type="search"
                className="py-2.5 pl-10 pr-4 bg-gray-50 border rounded-xl w-full focus:outline-none focus:border-primaryColor text-xs text-textColor font-semibold"
                placeholder="Type brand medicine name (e.g. Crocin, Lipitor, Augmentin)..."
                value={medQuery}
                onChange={(e) => setMedQuery(e.target.value)}
              />
            </div>
          </div>

          {loadingMeds ? (
            <div className="flex py-6 justify-center"><HashLoader size={20} color="#0d9488" /></div>
          ) : medicines.length === 0 ? (
            <p className="text-xs text-textColor italic py-3">No matching medicines listed. Try searching "Crocin" or "Lipitor".</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              {medicines.map((med, idx) => {
                const diff = med.brandPrice - med.genericPrice;
                const savingsPct = Math.round((diff / med.brandPrice) * 100);
                return (
                  <div key={idx} className="bg-gray-50/50 p-4 border border-gray-150 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm hover:bg-white hover:border-primaryColor/20 transition-all">
                    <div className="space-y-1">
                      <span className="bg-primaryColor/10 text-primaryColor text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full w-fit block">
                        Swap Approved
                      </span>
                      <h4 className="font-bold text-headingColor text-xs">{med.brandName} ➔ {med.genericName}</h4>
                      <p className="text-[10px] text-textColor">Class: {med.drugClass || "Essential Drug"}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-textColor">Brand: <span className="line-through">₹{med.brandPrice}</span></span>
                        <span className="text-teal-700 font-extrabold">Generic: ₹{med.genericPrice}</span>
                      </div>

                      {/* Savings progress bar */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wide">Total Savings</span>
                          <span className="text-[10px] text-indigo-700 font-extrabold">{savingsPct}% cheaper</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full transition-all duration-500" 
                            style={{ width: `${savingsPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3 — MEDICAL LOAN & EMI PLANNER */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b pb-3.5">
            <FaFileInvoiceDollar className="text-primaryColor" size={16} />
            <div>
              <h3 className="font-extrabold text-headingColor text-base">Medical Loan & EMI Planner</h3>
              <p className="text-[11px] text-textColor mt-0.5">Apply for zero-foreclosure healthcare financing at flat 10% interest rates.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Range sliders */}
            <div className="space-y-6 bg-gray-50 border p-5 rounded-2xl">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-headingColor uppercase">
                  <span>Requested Loan Amount</span>
                  <span className="text-primaryColor font-extrabold">₹{loanAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={500000}
                  step={5000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                  className="w-full accent-primaryColor cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>₹10,000</span>
                  <span>₹5,00,000</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-headingColor uppercase">
                  <span>Financing Tenure</span>
                  <span className="text-primaryColor font-extrabold">{loanTenure} Months</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={24}
                  step={6}
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(parseInt(e.target.value))}
                  className="w-full accent-primaryColor cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>6 Months</span>
                  <span>24 Months</span>
                </div>
              </div>
            </div>

            {/* Calculations & CTA */}
            {loanResult && (
              <div className="bg-teal-50/20 border border-teal-150 p-5 rounded-3xl space-y-4 shadow-sm">
                <div className="flex justify-between border-b pb-2 text-xs">
                  <span className="font-semibold text-textColor">Interest Rate (Flat):</span>
                  <span className="font-bold text-headingColor">10% per annum</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-xs">
                  <span className="font-semibold text-textColor">Total Interest Paid:</span>
                  <span className="font-bold text-headingColor">₹{loanResult.interest.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-xs">
                  <span className="font-semibold text-textColor">Total Repayment Amount:</span>
                  <span className="font-bold text-headingColor">₹{loanResult.total.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Estimated Monthly EMI</p>
                    <p className="text-2xl font-[950] text-primaryColor">₹{loanResult.emi.toLocaleString()} <span className="text-xs font-bold">/ mo</span></p>
                  </div>
                  <button
                    onClick={handleApplyLoan}
                    disabled={submittingLoan}
                    className="bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-teal-600/15"
                  >
                    {submittingLoan ? "Applying..." : "Apply for EMI Plan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
