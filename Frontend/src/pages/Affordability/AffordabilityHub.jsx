import { useState, useEffect } from "react";
import { BASE_URL } from "../../config";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import Loading from "../../components/Loader/Loading.jsx";
import {
  AiOutlineSliders,
  AiOutlinePercentage,
  AiOutlineCalculator,
  AiOutlineFileProtect,
  AiOutlineShoppingCart,
  AiOutlineWarning,
} from "react-icons/ai";

const AffordabilityHub = () => {
  const [activeSubTab, setActiveSubTab] = useState("financial-assistant");

  // Healthcare Financial Assistant States
  const [assistantTreatment, setAssistantTreatment] = useState("Appendix Surgery");
  const [assistantInsurance, setAssistantInsurance] = useState("Star Health");
  const [assistantIncome, setAssistantIncome] = useState("120000");
  const [assistantFamilySize, setAssistantFamilySize] = useState("4");
  const [assistantResult, setAssistantResult] = useState(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Comparison & Recommendations States
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [filters, setFilters] = useState({
    query: "",
    specialty: "",
    insurance: "",
    budget: "",
    maxDistance: "",
    maxWaitTime: "",
  });
  const [recDoctors, setRecDoctors] = useState([]);

  // Bed Dashboard State
  const [bedsData, setBedsData] = useState([]);

  // Scheme Checker State
  const [schemeId, setSchemeId] = useState("pmjay");
  const [incomeInput, setIncomeInput] = useState("");
  const [familySizeInput, setFamilySizeInput] = useState("");
  const [schemeResult, setSchemeResult] = useState(null);
  const [schemeLoading, setSchemeLoading] = useState(false);

  // Estimator State
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [selectedInsurance, setSelectedInsurance] = useState("");
  const [estimatorResult, setEstimatorResult] = useState(null);
  const [estimatorLoading, setEstimatorLoading] = useState(false);
  const [insurances, setInsurances] = useState([]);

  // Loan State
  const [emiAmount, setEmiAmount] = useState("");
  const [emiMonths, setEmiMonths] = useState("12");
  const [emiResult, setEmiResult] = useState(null);
  const [loanHospital, setLoanHospital] = useState("");
  const [loanTreatment, setLoanTreatment] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanTenure, setLoanTenure] = useState("12");
  const [loanLoading, setLoanLoading] = useState(false);
  const [myLoans, setMyLoans] = useState([]);

  // Pharmacy States
  const [medQuery, setMedQuery] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);

  // Drug Interaction Checker States
  const [drugsList, setDrugsList] = useState([]);
  const [currentDrug, setCurrentDrug] = useState("");
  const [interactionResult, setInteractionResult] = useState(null);
  const [interactionLoading, setInteractionLoading] = useState(false);

  // Initial Fetches
  useEffect(() => {
    fetchHospitals();
    fetchInsurances();
    fetchBeds();
    fetchMyLoans();
    fetchMedicines();
  }, []);

  const fetchHospitals = async () => {
    setLoadingHospitals(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hospitals/recommendations?query=${filters.query}&specialty=${filters.specialty}&insurance=${filters.insurance}&budget=${filters.budget}&maxDistance=${filters.maxDistance}&maxWaitTime=${filters.maxWaitTime}`
      );
      const json = await res.json();
      if (res.ok) {
        setHospitals(json.data.hospitals || []);
        setRecDoctors(json.data.doctors || []);
      }
    } catch (e) {
      toast.error("Failed to load hospitals list");
    } finally {
      setLoadingHospitals(false);
    }
  };

  const fetchInsurances = async () => {
    try {
      const res = await fetch(`${BASE_URL}/affordability/insurances`);
      const json = await res.json();
      if (res.ok) setInsurances(json.data || []);
    } catch (e) {}
  };

  const fetchBeds = async () => {
    try {
      const res = await fetch(`${BASE_URL}/hospitals/beds`);
      const json = await res.json();
      if (res.ok) setBedsData(json.data || []);
    } catch (e) {}
  };

  const fetchMyLoans = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/financial/loans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setMyLoans(json.data || []);
    } catch (e) {}
  };

  const fetchMedicines = async () => {
    setLoadingMeds(true);
    try {
      const res = await fetch(`${BASE_URL}/pharmacy/medicines?query=${medQuery}`);
      const json = await res.json();
      if (res.ok) setMedicines(json.data || []);
    } catch (e) {}
    setLoadingMeds(false);
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchHospitals();
  };

  const handleResetFilters = () => {
    setFilters({ query: "", specialty: "", insurance: "", budget: "", maxDistance: "", maxWaitTime: "" });
    setTimeout(() => fetchHospitals(), 50);
  };

  const handleEstimateCoverage = async (e) => {
    e.preventDefault();
    if (!selectedHospital || !selectedTreatment) {
      toast.error("Please select a hospital and treatment");
      return;
    }
    setEstimatorLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/affordability/coverage-estimator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: selectedHospital,
          treatmentName: selectedTreatment,
          insuranceProvider: selectedInsurance,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setEstimatorResult(json);
      } else {
        toast.error(json.message);
      }
    } catch (e) {
      toast.error("Estimation failed");
    } finally {
      setEstimatorLoading(false);
    }
  };

  const handleSchemeCheck = async (e) => {
    e.preventDefault();
    setSchemeLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/affordability/eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId,
          income: incomeInput,
          familySize: familySizeInput,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSchemeResult(json);
      } else {
        toast.error(json.message);
      }
    } catch (e) {
      toast.error("Scheme verification failed");
    } finally {
      setSchemeLoading(false);
    }
  };

  const handleEmiCalculate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/financial/estimate?amount=${emiAmount}&months=${emiMonths}`);
      const json = await res.json();
      if (res.ok) {
        setEmiResult(json);
      }
    } catch (e) {}
  };

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to apply for a medical loan.");
      return;
    }
    setLoanLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/financial/loan-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hospitalId: loanHospital,
          treatmentName: loanTreatment,
          requestedAmount: loanAmount,
          tenureMonths: loanTenure,
        }),
      });
      const json = await res.json();
      setLoanLoading(false);
      if (res.ok) {
        toast.success("EMI request submitted successfully!");
        setLoanHospital("");
        setLoanTreatment("");
        setLoanAmount("");
        fetchMyLoans();
      } else {
        toast.error(json.message);
      }
    } catch (e) {
      toast.error("Loan application failed");
      setLoanLoading(false);
    }
  };

  const handleRunAssistant = async (e) => {
    e.preventDefault();
    setAssistantLoading(true);
    setAssistantResult(null);

    try {
      const costRes = await fetch(`${BASE_URL}/affordability/predict-costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentName: assistantTreatment,
          insuranceProvider: assistantInsurance,
        }),
      });
      const costJson = await costRes.json();

      const pmjayRes = await fetch(`${BASE_URL}/affordability/eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId: "pmjay",
          income: assistantIncome,
          familySize: assistantFamilySize,
        }),
      });
      const pmjayJson = await pmjayRes.json();

      if (costRes.ok && pmjayRes.ok) {
        setAssistantResult({
          costs: costJson.data,
          pmjay: pmjayJson,
        });
      } else {
        toast.error("Failed to run financial analysis.");
      }
    } catch (err) {
      toast.error("Network error during assessment.");
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleAddDrug = (e) => {
    e.preventDefault();
    if (!currentDrug.trim()) return;
    if (drugsList.some((d) => d.toLowerCase() === currentDrug.trim().toLowerCase())) {
      toast.warning("This drug is already in your list.");
      return;
    }
    setDrugsList([...drugsList, currentDrug.trim()]);
    setCurrentDrug("");
  };

  const handleRemoveDrug = (index) => {
    setDrugsList(drugsList.filter((_, idx) => idx !== index));
  };

  const handleCheckInteractions = async (e) => {
    e.preventDefault();
    if (drugsList.length < 2) {
      toast.error("Please add at least 2 drugs to check interactions.");
      return;
    }
    setInteractionLoading(true);
    setInteractionResult(null);
    try {
      const res = await fetch(`${BASE_URL}/ai/drug-interaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugs: drugsList }),
      });
      const json = await res.json();
      if (res.ok) {
        setInteractionResult(json.analysis);
      } else {
        toast.error(json.message || "Failed to analyze drug interactions.");
      }
    } catch (err) {
      toast.error("Network error when checking interactions.");
    } finally {
      setInteractionLoading(false);
    }
  };

  return (
    <section className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-[1280px] px-5 mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-headingColor">Access & Affordability Hub</h2>
          <p className="text-textColor text-sm mt-2 max-w-[650px] mx-auto">
            Compare treatment costs, estimate out-of-pocket expenses, verify PM-JAY eligibility, apply for medical loans, and compare medicine prices.
          </p>
        </div>

        {/* Sub-navigation bar */}
        <div className="flex flex-wrap gap-2 justify-center border-b border-gray-200 pb-4 mb-8 bg-white p-3 rounded-lg shadow-sm">
          <button
            onClick={() => setActiveSubTab("compare")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-all ${
              activeSubTab === "compare"
                ? "bg-primaryColor text-white"
                : "text-headingColor bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <AiOutlineSliders size={16} />
            Hospital Comparison
          </button>
          <button
            onClick={() => setActiveSubTab("financial-assistant")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-all ${
              activeSubTab === "financial-assistant"
                ? "bg-primaryColor text-white"
                : "text-headingColor bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <AiOutlineCalculator size={16} />
            Healthcare Financial Assistant
          </button>
          <button
            onClick={() => setActiveSubTab("insurance")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-all ${
              activeSubTab === "insurance"
                ? "bg-primaryColor text-white"
                : "text-headingColor bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <AiOutlinePercentage size={16} />
            Insurance & Ayushman Bharat
          </button>
          <button
            onClick={() => setActiveSubTab("loans")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-all ${
              activeSubTab === "loans"
                ? "bg-primaryColor text-white"
                : "text-headingColor bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <AiOutlineCalculator size={16} />
            Medical Loans / EMI
          </button>
          <button
            onClick={() => setActiveSubTab("beds")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-all ${
              activeSubTab === "beds"
                ? "bg-primaryColor text-white"
                : "text-headingColor bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <AiOutlineFileProtect size={16} />
            Beds Availability
          </button>
          <button
            onClick={() => setActiveSubTab("pharmacy")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-all ${
              activeSubTab === "pharmacy"
                ? "bg-primaryColor text-white"
                : "text-headingColor bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <AiOutlineShoppingCart size={16} />
            Pharmacy Savings
          </button>
          <button
            onClick={() => setActiveSubTab("drug-checker")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-all ${
              activeSubTab === "drug-checker"
                ? "bg-primaryColor text-white"
                : "text-headingColor bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <AiOutlineWarning size={16} />
            Drug Interactions
          </button>
        </div>

        {/* SUB TAB CONTENTS */}

        {/* SUB TAB CONTENTS */}

        {/* Tab 0: Healthcare Financial Assistant */}
        {activeSubTab === "financial-assistant" && (
          <div className="space-y-8">
            {/* Input Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm max-w-[800px]">
              <h3 className="text-lg font-extrabold text-headingColor mb-2">Healthcare Financial Assistant</h3>
              <p className="text-xs text-textColor leading-5 mb-6">
                Select your surgery type and fill in your household income details. Our system will analyze private insurance network support, verify Ayushman Bharat (PM-JAY) eligibility, and estimate your out-of-pocket costs across network and civil hospitals.
              </p>

              <form onSubmit={handleRunAssistant} className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
                    Treatment / Surgery
                  </label>
                  <select
                    value={assistantTreatment}
                    onChange={(e) => setAssistantTreatment(e.target.value)}
                    className="w-full p-3 border rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor"
                  >
                    <option value="Appendix Surgery">Appendix Surgery</option>
                    <option value="Angioplasty">Angioplasty</option>
                    <option value="Hernia Surgery">Hernia Surgery</option>
                    <option value="Cataract Operation">Cataract Operation</option>
                    <option value="Knee Replacement">Knee Replacement</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
                    Private Insurance Provider
                  </label>
                  <select
                    value={assistantInsurance}
                    onChange={(e) => setAssistantInsurance(e.target.value)}
                    className="w-full p-3 border rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor"
                  >
                    <option value="Star Health">Star Health</option>
                    <option value="HDFC Ergo">HDFC Ergo</option>
                    <option value="Max Bupa">Max Bupa</option>
                    <option value="None">None / Self-Pay</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
                    Monthly Household Income (INR)
                  </label>
                  <input
                    type="number"
                    value={assistantIncome}
                    onChange={(e) => setAssistantIncome(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full p-3 border rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
                    Household Family Size
                  </label>
                  <input
                    type="number"
                    value={assistantFamilySize}
                    onChange={(e) => setAssistantFamilySize(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full p-3 border rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor"
                    required
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={assistantLoading}
                    className="btn rounded-xl px-6 py-3 text-sm font-semibold transition-all"
                  >
                    {assistantLoading ? <HashLoader size={18} color="#fff" /> : "Run Financial Assessment"}
                  </button>
                </div>
              </form>
            </div>

            {/* Assessment Dashboard */}
            {assistantResult && (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Hospital Compare Grid & Cashless Status */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Scheme Eligibility Box */}
                  <div
                    className={`p-5 rounded-2xl border flex justify-between items-center ${
                      assistantResult.pmjay.eligible
                        ? "bg-green-50/50 border-green-200 text-green-800"
                        : "bg-gray-50 border-gray-200 text-textColor"
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm uppercase tracking-wide">
                        Ayushman Bharat (PM-JAY) Status
                      </h4>
                      <p className="text-xs">
                        {assistantResult.pmjay.eligible
                          ? `Eligible ✔. You qualify for 100% cashless hospitalization up to ${assistantResult.pmjay.maxCoverage} INR.`
                          : "Not eligible based on your income / family size criteria thresholds."}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                        assistantResult.pmjay.eligible
                          ? "bg-green-100 border-green-300 text-green-700 animate-pulse"
                          : "bg-gray-100 border-gray-300 text-textColor"
                      }`}
                    >
                      {assistantResult.pmjay.eligible ? "ELIGIBLE" : "INELIGIBLE"}
                    </span>
                  </div>

                  {/* Hospitals cost estimates */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-headingColor text-base">Cost Comparison Across Network & Civil Hospitals</h4>
                    <div className="grid gap-4">
                      {assistantResult.costs.map((c, idx) => {
                        // Calculate specific out-of-pocket based on PM-JAY eligibility and private coverage
                        let finalOutofPocket = c.totalCost;
                        let statusTag = "Self-Pay";
                        let statusColor = "bg-gray-150 border-gray-300 text-headingColor";

                        const acceptsPMJAY = c.hospitalName.toLowerCase().includes("civil") || c.hospitalName.toLowerCase().includes("medicare") || c.hospitalName.toLowerCase().includes("apollo");

                        if (assistantResult.pmjay.eligible && acceptsPMJAY) {
                          finalOutofPocket = 0;
                          statusTag = "100% Cashless PM-JAY";
                          statusColor = "bg-green-100 border-green-300 text-green-700";
                        } else if (c.acceptsInsurance) {
                          finalOutofPocket = c.totalCost * 0.15;
                          statusTag = "15% Co-Pay Net";
                          statusColor = "bg-yellow-100 border-yellow-300 text-yellow-700";
                        } else if (assistantInsurance !== "None") {
                          statusTag = "Insurance Out of Network";
                          statusColor = "bg-red-50 border-red-200 text-red-700";
                        }

                        return (
                          <div
                            key={idx}
                            className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center hover:shadow-md transition-all duration-200"
                          >
                            <div className="space-y-1">
                              <h5 className="font-extrabold text-headingColor text-sm">{c.hospitalName}</h5>
                              <p className="text-[10px] text-textColor font-medium">
                                {c.location} • {c.distance} km • Avg Wait: {c.waitingTime} mins
                              </p>
                              <span className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${statusColor}`}>
                                {statusTag}
                              </span>
                            </div>

                            <div className="flex gap-6 items-center text-right self-stretch md:self-auto justify-between border-t md:border-t-0 pt-3 md:pt-0">
                              <div>
                                <span className="text-[10px] text-textColor block">Standard Surgery Cost</span>
                                <span className="text-xs font-semibold text-slate-500 line-through">
                                  {c.totalCost.toLocaleString("en-IN")} INR
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-headingColor font-bold block">Your Out-of-Pocket</span>
                                <span className="text-sm font-extrabold text-primaryColor">
                                  {finalOutofPocket === 0 ? "₹0 (Cashless)" : `₹${finalOutofPocket.toLocaleString("en-IN")}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Medical Loan / EMI suggestion and Action */}
                <div className="space-y-6">
                  <div className="bg-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white space-y-6">
                    <div className="border-b border-slate-800 pb-4">
                      <h4 className="font-extrabold text-white text-base">Financing Triage</h4>
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block mt-0.5">
                        Medical EMI Calculator
                      </span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 leading-5">
                        If your out-of-pocket costs exceed your current budget, you can quick-apply for medical EMI financing below at a flat 10% annual rate.
                      </p>

                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span>Out-of-Pocket Cost</span>
                          <span className="font-bold text-teal-400">
                            {assistantResult.costs[0]?.totalCost ? "₹" + (assistantResult.costs[0].totalCost * 0.15).toLocaleString("en-IN") : "₹0"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span>EMI Tenure Option</span>
                          <span className="font-bold text-indigo-400">12 Months</span>
                        </div>
                        <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs">
                          <span className="font-bold">Estimated Monthly EMI</span>
                          <span className="text-sm font-extrabold text-teal-400">
                            {assistantResult.costs[0]?.totalCost
                              ? "₹" + Math.round(((assistantResult.costs[0].totalCost * 0.15) * 1.1) / 12).toLocaleString("en-IN") + "/mo"
                              : "₹0/mo"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveSubTab("loans");
                          setLoanHospital(assistantResult.costs[0]?.hospitalName || "");
                          setLoanTreatment(assistantTreatment);
                          setLoanAmount(assistantResult.costs[0]?.totalCost ? String(assistantResult.costs[0].totalCost * 0.15) : "");
                          toast.info("EMI form pre-filled successfully! Fill details to apply.");
                        }}
                        className="w-full bg-primaryColor hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-teal-600/10"
                      >
                        Proceed to Loan Request
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Compare Hospitals */}
        {activeSubTab === "compare" && (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filter Panel */}
            <div className="lg:col-span-1 bg-white p-5 rounded-lg border border-gray-100 shadow-sm h-fit">
              <h4 className="font-bold text-headingColor mb-4">Smart Hospital Filter</h4>
              <form onSubmit={handleApplyFilters} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Symptom / Surgery / Disease</label>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                    placeholder="e.g. Appendix, Hernia, Heart..."
                    className="w-full p-2 border rounded text-xs text-textColor focus:outline-none focus:border-primaryColor bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Specialty</label>
                  <select
                    value={filters.specialty}
                    onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                    className="w-full p-2 border rounded text-xs text-textColor"
                  >
                    <option value="">Any Specialty</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="General Surgery">General Surgery</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Insurance accepted</label>
                  <select
                    value={filters.insurance}
                    onChange={(e) => setFilters({ ...filters, insurance: e.target.value })}
                    className="w-full p-2 border rounded text-xs text-textColor"
                  >
                    <option value="">Any Insurance</option>
                    {insurances.map((ins, idx) => (
                      <option key={idx} value={ins}>
                        {ins}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Max Treatment Budget (INR)</label>
                  <input
                    type="number"
                    value={filters.budget}
                    onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                    placeholder="e.g. 100000"
                    className="w-full p-2 border rounded text-xs text-textColor"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Max Distance (km)</label>
                  <input
                    type="number"
                    value={filters.maxDistance}
                    onChange={(e) => setFilters({ ...filters, maxDistance: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full p-2 border rounded text-xs text-textColor"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Max Wait Time (mins)</label>
                  <input
                    type="number"
                    value={filters.maxWaitTime}
                    onChange={(e) => setFilters({ ...filters, maxWaitTime: e.target.value })}
                    placeholder="e.g. 30"
                    className="w-full p-2 border rounded text-xs text-textColor"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="btn flex-1 rounded text-xs py-2 font-semibold">
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 border rounded text-xs text-textColor hover:bg-gray-50 flex-1 font-semibold"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Listings Grid */}
            <div className="lg:col-span-3 space-y-6">
              <h4 className="font-bold text-headingColor">Matching Hospitals & Prices</h4>
              {loadingHospitals && <Loading />}
              {!loadingHospitals && hospitals.length === 0 && (
                <p className="text-textColor italic text-sm">No hospitals matched your filters.</p>
              )}
              {!loadingHospitals && hospitals.length > 0 && (
                <div className="grid gap-6">
                  {hospitals.map((h) => (
                    <div
                      key={h._id}
                      className="bg-white p-5 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all grid md:grid-cols-3 gap-6"
                    >
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-headingColor text-lg">{h.name}</h5>
                            <span className="text-xs text-primaryColor font-medium">{h.location}</span>
                          </div>
                          <span className="bg-yellow-50 text-yellow-700 border border-yellow-100 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            ⭐ {h.rating}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {h.specialties.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-gray-50 border text-textColor px-2 py-0.5 rounded font-semibold"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 pt-2 space-y-1">
                          <p>
                            <strong>Distance:</strong> {h.distance} km from you
                          </p>
                          <p>
                            <strong>Avg. Waiting Time:</strong> {h.waitingTime} minutes
                          </p>
                          <p>
                            <strong>Accepted Insurances:</strong>{" "}
                            <span className="text-headingColor font-medium">
                              {h.supportedInsurances.join(", ")}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg flex flex-col justify-between border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase block mb-2">
                          Treatment Costs
                        </span>
                        <div className="space-y-1.5">
                          {filters.query && h.treatmentCosts.find(t => t.treatmentName.toLowerCase().includes(filters.query.toLowerCase())) ? (
                            (() => {
                              const matched = h.treatmentCosts.find(t => t.treatmentName.toLowerCase().includes(filters.query.toLowerCase()));
                              return (
                                <div className="bg-teal-100 border border-teal-200 p-2.5 rounded-lg mb-2 text-xs font-extrabold text-teal-800 flex justify-between animate-pulse">
                                  <span>✨ Matched: {matched.treatmentName}</span>
                                  <span>{matched.cost.toLocaleString("en-IN")} INR</span>
                                </div>
                              );
                            })()
                          ) : null}
                          {h.treatmentCosts.slice(0, 3).map((t, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-textColor">
                              <span>{t.treatmentName}</span>
                              <span className="font-bold text-headingColor">{t.cost.toLocaleString("en-IN")} INR</span>
                            </div>
                          ))}
                        </div>
                        {h.treatmentCosts.length > 3 && (
                          <span className="text-[10px] text-textColor block mt-2 text-right">
                            + {h.treatmentCosts.length - 3} more treatments
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Insurance & PM-JAY Checker */}
        {activeSubTab === "insurance" && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Out of Pocket Estimator */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-6">
              <h4 className="font-bold text-headingColor text-lg border-b pb-3">Out-of-Pocket Expense Estimator</h4>
              <form onSubmit={handleEstimateCoverage} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-headingColor block mb-1">Select Hospital</label>
                  <select
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    className="w-full p-2.5 border rounded text-xs text-textColor bg-white"
                  >
                    <option value="">-- Choose Hospital --</option>
                    {hospitals.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-headingColor block mb-1">Select Treatment</label>
                  <select
                    value={selectedTreatment}
                    onChange={(e) => setSelectedTreatment(e.target.value)}
                    className="w-full p-2.5 border rounded text-xs text-textColor bg-white"
                  >
                    <option value="">-- Choose Treatment --</option>
                    <option value="Angioplasty">Angioplasty</option>
                    <option value="Hernia Surgery">Hernia Surgery</option>
                    <option value="Cataract Operation">Cataract Operation</option>
                    <option value="Knee Replacement">Knee Replacement</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-headingColor block mb-1">Insurance Provider</label>
                  <select
                    value={selectedInsurance}
                    onChange={(e) => setSelectedInsurance(e.target.value)}
                    className="w-full p-2.5 border rounded text-xs text-textColor bg-white"
                  >
                    <option value="">Self-Pay (No Insurance)</option>
                    {insurances.map((ins, idx) => (
                      <option key={idx} value={ins}>
                        {ins}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={estimatorLoading}
                  className="btn w-full rounded py-2.5 text-xs font-semibold"
                >
                  {estimatorLoading ? "Calculating..." : "Estimate Costs"}
                </button>
              </form>

              {estimatorResult && (
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-3">
                  <div className="flex justify-between text-sm text-textColor">
                    <span>Treatment Cost:</span>
                    <span className="font-bold text-headingColor">{estimatorResult.totalCost} INR</span>
                  </div>
                  <div className="flex justify-between text-sm text-textColor">
                    <span>Insurance Coverage ({estimatorResult.coveragePercentage}%):</span>
                    <span className="font-bold text-green-600">-{estimatorResult.estimatedCoverage} INR</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2 font-bold text-headingColor">
                    <span>Estimated Patient Pay:</span>
                    <span className="text-red-600">{estimatorResult.outOfPocket} INR</span>
                  </div>
                  <p className="text-[11px] text-textColor italic mt-2 bg-white p-2.5 border rounded">
                    {estimatorResult.note}
                  </p>
                </div>
              )}
            </div>

            {/* PM-JAY & Gov Scheme Checker */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-6">
              <h4 className="font-bold text-headingColor text-lg border-b pb-3">Govt Scheme Eligibility Checker</h4>
              <form onSubmit={handleSchemeCheck} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-headingColor block mb-1">Select Scheme</label>
                  <select
                    value={schemeId}
                    onChange={(e) => setSchemeId(e.target.value)}
                    className="w-full p-2.5 border rounded text-xs text-textColor bg-white"
                  >
                    <option value="pmjay">Ayushman Bharat (PM-JAY)</option>
                    <option value="state-care">State Chief Minister Health Scheme</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-headingColor block mb-1">Annual Household Income (INR)</label>
                  <input
                    type="number"
                    required
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full p-2.5 border rounded text-xs text-textColor"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-headingColor block mb-1">Family Size (Members)</label>
                  <input
                    type="number"
                    required
                    value={familySizeInput}
                    onChange={(e) => setFamilySizeInput(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full p-2.5 border rounded text-xs text-textColor"
                  />
                </div>

                <button
                  type="submit"
                  disabled={schemeLoading}
                  className="btn w-full rounded py-2.5 text-xs font-semibold"
                >
                  {schemeLoading ? "Verifying..." : "Verify Scheme Eligibility"}
                </button>
              </form>

              {schemeResult && (
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        schemeResult.eligible
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}
                    >
                      {schemeResult.eligible ? "Eligible" : "Not Eligible"}
                    </span>
                    <h5 className="font-bold text-headingColor text-sm">{schemeResult.schemeName}</h5>
                  </div>

                  {schemeResult.eligible && (
                    <div className="space-y-3 text-xs text-textColor">
                      <p>
                        <strong>Max Benefit Cap:</strong> {schemeResult.maxCoverage} INR per family/year
                      </p>
                      <div>
                        <strong>Required Documents for Enrollment:</strong>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {schemeResult.requiredDocuments.map((doc, idx) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Covered Medical Specialties:</strong>
                        <p className="mt-1 font-medium text-headingColor">
                          {schemeResult.coveredTreatments.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {!schemeResult.eligible && (
                    <p className="text-xs text-red-600 italic">
                      Income exceeds threshold limit ({schemeResult.rulesChecked.incomeLimit} INR) or family size limits reached. Check other schemes.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Medical Loans & EMI */}
        {activeSubTab === "loans" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* EMI Loan Calculator */}
            <div className="lg:col-span-1 bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-5 h-fit">
              <h4 className="font-bold text-headingColor border-b pb-3">Treatment Affordability Calculator</h4>
              <form onSubmit={handleEmiCalculate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Requested Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={emiAmount}
                    onChange={(e) => setEmiAmount(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full p-2 border rounded text-xs text-textColor"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Tenure (Months)</label>
                  <select
                    value={emiMonths}
                    onChange={(e) => setEmiMonths(e.target.value)}
                    className="w-full p-2 border rounded text-xs text-textColor bg-white"
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>

                <button type="submit" className="btn w-full rounded text-xs py-2 font-semibold">
                  Calculate EMI
                </button>
              </form>

              {emiResult && (
                <div className="bg-gray-50 p-4 rounded border border-gray-100 text-xs space-y-2 text-textColor">
                  <div className="flex justify-between">
                    <span>Principal Amount:</span>
                    <span className="font-bold text-headingColor">{emiResult.amount} INR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tenure Length:</span>
                    <span className="font-semibold text-headingColor">{emiResult.months} Months</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Rate:</span>
                    <span className="font-semibold text-headingColor">{emiResult.interestRate}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-sm font-bold text-headingColor">
                    <span>Estimated Monthly EMI:</span>
                    <span className="text-primaryColor">{emiResult.estimatedEMI} INR/month</span>
                  </div>
                </div>
              )}
            </div>

            {/* Apply Loan Form */}
            <div className="lg:col-span-1 bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-5 h-fit">
              <h4 className="font-bold text-headingColor border-b pb-3">Apply for Medical Loan</h4>
              <form onSubmit={handleApplyLoan} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Hospital</label>
                  <select
                    value={loanHospital}
                    onChange={(e) => setLoanHospital(e.target.value)}
                    required
                    className="w-full p-2 border rounded text-xs text-textColor bg-white"
                  >
                    <option value="">-- Choose Hospital --</option>
                    {hospitals.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Treatment</label>
                  <input
                    type="text"
                    required
                    value={loanTreatment}
                    onChange={(e) => setLoanTreatment(e.target.value)}
                    placeholder="e.g. Angioplasty"
                    className="w-full p-2 border rounded text-xs text-textColor"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Requested Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full p-2 border rounded text-xs text-textColor"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">Tenure (Months)</label>
                  <select
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(e.target.value)}
                    className="w-full p-2 border rounded text-xs text-textColor bg-white"
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-headingColor block mb-1">
                    Upload Income Proof / Identity (Placeholders)
                  </label>
                  <input type="file" disabled className="w-full text-xs text-gray-400" />
                </div>

                <button
                  type="submit"
                  disabled={loanLoading}
                  className="btn w-full rounded text-xs py-2 font-semibold"
                >
                  {loanLoading ? "Submitting..." : "Apply Loan"}
                </button>
              </form>
            </div>

            {/* Loans History / Dashboard */}
            <div className="lg:col-span-1 bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-5 h-fit">
              <h4 className="font-bold text-headingColor border-b pb-3">My Loan Applications</h4>
              {myLoans.length === 0 ? (
                <p className="text-xs text-textColor italic">No medical loans applied yet.</p>
              ) : (
                <div className="space-y-4">
                  {myLoans.map((loan) => (
                    <div key={loan._id} className="p-4 border rounded bg-gray-50 space-y-2 text-xs text-textColor">
                      <div className="flex justify-between font-bold">
                        <span className="text-headingColor">{loan.treatmentName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            loan.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>
                      <p>
                        <strong>Hospital:</strong> {loan.hospital?.name}
                      </p>
                      <p>
                        <strong>Amount:</strong> {loan.requestedAmount} INR
                      </p>
                      <p>
                        <strong>EMI:</strong> {loan.monthlyEMI} INR/month ({loan.tenureMonths} mos)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Bed & Resource Management */}
        {activeSubTab === "beds" && (
          <div>
            <h4 className="font-bold text-headingColor text-lg mb-6">Live Hospital Bed Availability</h4>
            {bedsData.length === 0 ? (
              <p className="text-textColor text-sm italic">Loading bed counts...</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bedsData.map((h) => (
                  <div key={h._id} className="bg-white p-6 border border-gray-100 rounded-lg shadow-sm space-y-4">
                    <h5 className="font-bold text-headingColor text-base border-b pb-2">{h.name}</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-red-50 border rounded-md">
                        <span className="text-gray-500 block mb-1">ICU Beds</span>
                        <span className="text-lg font-bold text-red-600">
                          {h.beds?.icu?.available} / {h.beds?.icu?.total}
                        </span>
                      </div>
                      <div className="p-3 bg-blue-50 border rounded-md">
                        <span className="text-gray-500 block mb-1">General Beds</span>
                        <span className="text-lg font-bold text-blue-600">
                          {h.beds?.general?.available} / {h.beds?.general?.total}
                        </span>
                      </div>
                      <div className="p-3 bg-purple-50 border rounded-md">
                        <span className="text-gray-500 block mb-1">Private Rooms</span>
                        <span className="text-lg font-bold text-purple-600">
                          {h.beds?.private?.available} / {h.beds?.private?.total}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-50 border rounded-md">
                        <span className="text-gray-500 block mb-1">Emergency Beds</span>
                        <span className="text-lg font-bold text-amber-600">
                          {h.beds?.emergency?.available} / {h.beds?.emergency?.total}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Pharmacy Pricing comparison */}
        {activeSubTab === "pharmacy" && (
          <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
            <h4 className="font-bold text-headingColor text-lg border-b pb-3">Generic Alternative Medicines & Savings</h4>
            <div className="flex gap-2 max-w-[500px]">
              <input
                type="text"
                value={medQuery}
                onChange={(e) => setMedQuery(e.target.value)}
                placeholder="Search branded medicine (e.g. Crocin, Lipitor)..."
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:border-primaryColor text-sm text-textColor"
              />
              <button onClick={fetchMedicines} className="btn px-4 py-2 rounded text-xs font-semibold">
                Search
              </button>
            </div>

            {loadingMeds ? (
              <Loading />
            ) : (
              <div className="overflow-x-auto pt-4">
                <table className="w-full text-left text-sm text-gray-500 border collapse">
                  <thead className="bg-gray-50 text-headingColor uppercase text-xs border-b">
                    <tr>
                      <th className="py-3 px-4 border-b">Branded Medicine</th>
                      <th className="py-3 px-4 border-b">Branded Cost</th>
                      <th className="py-3 px-4 border-b">Generic Alternative</th>
                      <th className="py-3 px-4 border-b">Generic Cost</th>
                      <th className="py-3 px-4 border-b">Estimated Savings</th>
                      <th className="py-3 px-4 border-b">Indication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {medicines.map((m, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 text-textColor text-xs">
                        <td className="py-3 px-4 font-bold text-headingColor">{m.brandName}</td>
                        <td className="py-3 px-4 text-red-600 font-semibold">{m.brandPrice} INR</td>
                        <td className="py-3 px-4 font-semibold text-primaryColor">{m.genericName}</td>
                        <td className="py-3 px-4 text-green-600 font-bold">{m.genericPrice} INR</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded font-bold">
                            Save {m.savingsPercentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 italic">{m.indication}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Drug Interaction Checker */}
        {activeSubTab === "drug-checker" && (
          <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
            <div className="border-b pb-3">
              <h4 className="font-bold text-headingColor text-lg">AI Drug-Drug Interaction Checker</h4>
              <p className="text-xs text-textColor leading-5 max-w-[700px] mt-1">
                Add two or more medications to analyze potential synergistic side effects, contraindications, or metabolic warnings.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-headingColor block">Quick Presets (Click to add):</span>
              <div className="flex gap-2 flex-wrap">
                {["Paracetamol", "Ibuprofen", "Aspirin", "Warfarin", "Metformin", "Lisinopril"].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (drugsList.some((d) => d.toLowerCase() === preset.toLowerCase())) return;
                      setDrugsList([...drugsList, preset]);
                    }}
                    className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-textColor px-2.5 py-1 rounded text-xs font-semibold transition-all"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddDrug} className="flex gap-2 max-w-[500px]">
              <input
                type="text"
                value={currentDrug}
                onChange={(e) => setCurrentDrug(e.target.value)}
                placeholder="Or type medicine name (e.g. Crocin, Lipitor)..."
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:border-primaryColor text-sm text-textColor"
              />
              <button type="submit" className="btn px-4 py-2 rounded text-xs font-semibold">
                Add
              </button>
            </form>

            {/* List of Added Drugs */}
            {drugsList.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-headingColor block">Added Medicines:</span>
                <div className="flex gap-2 flex-wrap">
                  {drugsList.map((drug, index) => (
                    <span
                      key={index}
                      className="bg-teal-50 border border-teal-200 text-primaryColor px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"
                    >
                      {drug}
                      <button
                        type="button"
                        onClick={() => handleRemoveDrug(index)}
                        className="text-red-500 hover:text-red-700 font-extrabold focus:outline-none text-xs"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex gap-3 items-center">
              <button
                type="button"
                onClick={handleCheckInteractions}
                disabled={drugsList.length < 2 || interactionLoading}
                className="btn px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {interactionLoading ? <HashLoader size={18} color="#fff" /> : "Check Interactions"}
              </button>
              {drugsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDrugsList([]);
                    setInteractionResult(null);
                  }}
                  className="px-4 py-2.5 border rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Interaction Result Display */}
            {interactionResult && (
              <div
                className={`mt-6 p-5 border rounded-xl space-y-3 ${
                  interactionResult.includes("🚫") || interactionResult.includes("Dangerous") || interactionResult.toLowerCase().includes("high risk")
                    ? "bg-red-50/40 border-red-200"
                    : interactionResult.includes("⚠") || interactionResult.includes("Warning") || interactionResult.toLowerCase().includes("caution")
                    ? "bg-yellow-50/40 border-yellow-200"
                    : "bg-green-50/40 border-green-200"
                }`}
              >
                <h5
                  className={`font-extrabold text-sm flex items-center gap-1.5 ${
                    interactionResult.includes("🚫") || interactionResult.includes("Dangerous") || interactionResult.toLowerCase().includes("high risk")
                      ? "text-red-700"
                      : interactionResult.includes("⚠") || interactionResult.includes("Warning") || interactionResult.toLowerCase().includes("caution")
                      ? "text-yellow-700"
                      : "text-green-700"
                  }`}
                >
                  {interactionResult.includes("🚫") || interactionResult.includes("Dangerous") || interactionResult.toLowerCase().includes("high risk") ? (
                    <span>🚫 Clinical Alert: High-Risk Combination Detected</span>
                  ) : interactionResult.includes("⚠") || interactionResult.includes("Warning") || interactionResult.toLowerCase().includes("caution") ? (
                    <span>⚠ Clinical Alert: Caution Required</span>
                  ) : (
                    <span>✔ Clinical Status: Safe / No Contraindications Found</span>
                  )}
                </h5>
                <div className="text-sm text-textColor leading-6 whitespace-pre-line bg-white border border-gray-150 p-4 rounded-lg font-medium">
                  {interactionResult}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AffordabilityHub;
