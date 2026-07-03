import { BASE_URL } from "../../config";
import ErrorComponent from "../../components/Error/Error.jsx";
import Loader from "../../components/Loader/Loading.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BiSearch, BiFilterAlt, BiMap, BiStar, BiCalendarCheck } from "react-icons/bi";
import { FaHospital, FaCheckCircle, FaCrown, FaShieldAlt, FaRegClock, FaDollarSign, FaPhone } from "react-icons/fa";

// Cover images list for hospitals to make it look highly premium
const HOSPITAL_IMAGES = [
  "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80"
];

const HospitalCard = ({ hospital, index }) => {
  const navigate = useNavigate();
  
  // Estimate cost range from treatmentCosts array
  const costs = hospital.treatmentCosts?.map(tc => tc.cost) || [];
  const minCost = costs.length > 0 ? Math.min(...costs) : 500;
  const maxCost = costs.length > 0 ? Math.max(...costs) : 15000;

  // Determine badges
  const isPremium = hospital.rating >= 4.6;
  const isGovernment = hospital.supportedInsurances?.includes("PM-JAY");
  const imgUrl = HOSPITAL_IMAGES[index % HOSPITAL_IMAGES.length];

  return (
    <div 
      onClick={() => navigate(`/doctors/${hospital._id}`)}
      className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group h-full"
    >
      <div>
        {/* Cover Image & Badges */}
        <div className="h-44 w-full relative bg-gray-100 overflow-hidden">
          <img 
            src={imgUrl} 
            alt={hospital.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isPremium && (
              <span className="bg-amber-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <FaCrown size={8} /> Premium Partner
              </span>
            )}
            <span className="bg-teal-600 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm w-fit">
              <FaCheckCircle size={8} /> Verified
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-white">
            <span className="text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
              🏥 {hospital.city}
            </span>
            <span className="bg-amber-400 text-slate-900 text-xs px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
              ⭐ {hospital.rating}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          <div>
            <h3 className="font-extrabold text-headingColor text-base leading-snug group-hover:text-primaryColor transition-all">
              {hospital.name}
            </h3>
            <p className="text-xs text-textColor mt-1 flex items-center gap-1">
              <BiMap className="text-gray-400" /> {hospital.location || "Clinical Zone"}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-textColor">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">OPD Wait Time</p>
              <p className="font-extrabold text-headingColor flex items-center gap-1 mt-0.5">
                <FaRegClock className="text-teal-600" size={10} /> {hospital.waitingTime} mins
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Estimated Cost</p>
              <p className="font-extrabold text-headingColor flex items-center gap-1 mt-0.5">
                <FaDollarSign className="text-teal-600" size={10} /> ₹{minCost} - ₹{maxCost}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Distance</p>
              <p className="font-bold text-headingColor mt-0.5">📍 {hospital.distance} km away</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Emergency</p>
              <p className="font-bold text-red-600 mt-0.5 uppercase text-[10px]">🚨 24/7 Available</p>
            </div>
          </div>

          {/* Insurance Schemes */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Supported Insurances</span>
            <div className="flex flex-wrap gap-1">
              {hospital.supportedInsurances?.slice(0, 3).map((ins, i) => (
                <span key={i} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-semibold">
                  {ins}
                </span>
              ))}
              {isGovernment && (
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-extrabold">
                  PM-JAY Accepted
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Specialties list at footer */}
      <div className="px-5 pb-5 flex flex-wrap gap-1">
        {hospital.specialties?.slice(0, 3).map((spec, i) => (
          <span key={i} className="bg-gray-100 border text-headingColor text-[10px] px-2.5 py-1 rounded-md font-semibold">
            {spec}
          </span>
        ))}
      </div>
    </div>
  );
};

const Doctors = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");
  
  // Filters
  const [department, setDepartment] = useState("");
  const [insurance, setInsurance] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [maxWaitTime, setMaxWaitTime] = useState("");
  const [budget, setBudget] = useState("");

  const [hospitalsList, setHospitalsList] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setDebounceQuery(query.trim());
    }, 500);
    return () => clearTimeout(timeOut);
  }, [query]);

  const fetchHospitals = async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const url = `${BASE_URL}/hospitals/recommendations?query=${encodeURIComponent(debounceQuery)}&specialty=${department}&insurance=${insurance}&maxDistance=${maxDistance}&maxWaitTime=${maxWaitTime}&budget=${budget}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setHospitalsList(json.data.hospitals || []);
    } catch (err) {
      setFetchError(err.message || "Failed to load hospitals list");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [debounceQuery, department, insurance, maxDistance, maxWaitTime, budget]);

  const handleResetFilters = () => {
    setQuery("");
    setDebounceQuery("");
    setDepartment("");
    setInsurance("");
    setMaxDistance("");
    setMaxWaitTime("");
    setBudget("");
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Search Header Banner */}
      <section className="bg-white border-b border-gray-100 py-12 shadow-sm">
        <div className="container max-w-[1200px] mx-auto px-4 text-center">
          <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-primaryColor bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-full mb-3">
            Hospital Discovery Portal
          </span>
          <h2 className="text-3xl font-extrabold text-headingColor">Discover Partner Hospitals & Clinics</h2>
          <p className="text-textColor text-sm mt-2 max-w-[600px] mx-auto leading-relaxed">
            Search nearby clinical branches, compare estimated surgery costs side-by-side, verify insurance coverage networks, and monitor real-time ICU beds.
          </p>

          {/* Advanced Search Panel */}
          <div className="max-w-[1000px] mx-auto bg-white rounded-2xl shadow-md border border-gray-150 p-5 mt-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Query input */}
              <div className="relative flex-1">
                <BiSearch className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                <input
                  type="search"
                  className="py-3 pl-10 pr-4 bg-gray-50 border rounded-xl w-full focus:outline-none focus:border-primaryColor text-xs text-textColor font-medium"
                  placeholder="Search hospital name, location, surgery name (e.g. Angioplasty)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              
              {/* Specialty selection */}
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="py-3 px-3 bg-gray-50 border rounded-xl text-xs text-textColor focus:outline-none focus:border-primaryColor font-medium md:w-48 bg-white"
              >
                <option value="">All Specialties</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="General Surgery">General Surgery</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Ophthalmology">Ophthalmology</option>
              </select>

              {/* Insurance selector */}
              <select
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                className="py-3 px-3 bg-gray-50 border rounded-xl text-xs text-textColor focus:outline-none focus:border-primaryColor font-medium md:w-44 bg-white"
              >
                <option value="">All Insurances</option>
                <option value="PM-JAY">Ayushman Bharat (PM-JAY)</option>
                <option value="Star Health">Star Health</option>
                <option value="HDFC Ergo">HDFC Ergo</option>
                <option value="Max Bupa">Max Bupa</option>
              </select>
            </div>

            {/* Sub Filters Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="text-gray-400 font-bold flex items-center gap-1">
                <BiFilterAlt /> Filters:
              </span>
              
              {/* Distance Slider */}
              <select
                value={maxDistance}
                onChange={e => setMaxDistance(e.target.value)}
                className="bg-white border rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-textColor"
              >
                <option value="">Distance Range</option>
                <option value="5">Within 5 km</option>
                <option value="15">Within 15 km</option>
                <option value="50">Within 50 km</option>
              </select>

              {/* Wait Time */}
              <select
                value={maxWaitTime}
                onChange={e => setMaxWaitTime(e.target.value)}
                className="bg-white border rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-textColor"
              >
                <option value="">Wait Time</option>
                <option value="20">Under 20 mins</option>
                <option value="45">Under 45 mins</option>
                <option value="90">Under 90 mins</option>
              </select>

              {/* Budget / Price Limit */}
              <select
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="bg-white border rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-textColor"
              >
                <option value="">Treatment Budget</option>
                <option value="1000">Under ₹1,000</option>
                <option value="15000">Under ₹15,000</option>
                <option value="100000">Under ₹1,00,000</option>
              </select>

              {(department || insurance || maxDistance || maxWaitTime || budget || query) && (
                <button
                  onClick={handleResetFilters}
                  className="text-red-500 hover:text-red-700 font-bold ml-auto hover:underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Results Listing */}
      <section className="py-12">
        <div className="container max-w-[1200px] mx-auto px-4">
          {fetchLoading && <Loader />}
          {fetchError && <ErrorComponent errMsg={fetchError} />}

          {!fetchLoading && !fetchError && (
            <>
              {hospitalsList.length === 0 ? (
                <div className="text-center max-w-[500px] mx-auto bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
                  <FaHospital className="text-gray-300 mx-auto mb-3" size={50} />
                  <p className="font-extrabold text-headingColor text-base">No Partner Hospitals Found</p>
                  <p className="text-xs text-textColor mt-1.5 leading-5">
                    We couldn't find any healthcare centers matching your search parameters. Try expanding your filters or search tags.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 bg-primaryColor text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-all shadow-sm"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {hospitalsList.map((h, i) => (
                    <HospitalCard hospital={h} index={i} key={h._id} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Doctors;
