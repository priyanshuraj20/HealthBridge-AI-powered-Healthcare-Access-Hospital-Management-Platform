import { BASE_URL } from "../../config";
import DoctorCard from "../../components/Doctors/DoctorCard";
import Testimonials from "../../components/Testimonials/Testimonials";
import ErrorComponent from "../../components/Error/Error.jsx";
import Loader from "../../components/Loader/Loading.jsx";
import { useEffect, useState } from "react";

const HospitalCard = ({ hospital }) => {
  return (
    <div className="p-4 lg:p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className="bg-teal-50 border border-teal-200 text-teal-700 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
            {hospital.verificationStatus || "Active"}
          </span>
          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
            ⭐ {hospital.rating}
          </span>
        </div>
        <h3 className="font-extrabold text-headingColor text-base leading-snug group-hover:text-primaryColor transition-all">
          {hospital.name}
        </h3>
        <p className="text-xs text-textColor mt-1.5">
          📍 {hospital.address || hospital.location}, {hospital.city}
        </p>

        <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-textColor">
          <p><strong>OPD Wait:</strong> <span className="text-primaryColor font-bold">{hospital.waitingTime} mins</span></p>
          <p><strong>Distance:</strong> {hospital.distance} km</p>
          <p className="truncate"><strong>Insurances:</strong> {hospital.supportedInsurances?.slice(0, 3).join(", ")}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1">
        {hospital.specialties?.slice(0, 3).map((spec, i) => (
          <span key={i} className="bg-gray-50 border text-textColor text-[9px] px-2.5 py-0.5 rounded-md font-semibold">
            {spec}
          </span>
        ))}
      </div>
    </div>
  );
};

const Doctors = () => {
  const [query, setQuery] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");
  const [activeTab, setActiveTab] = useState("specialists"); // specialists or hospitals

  // Filters
  const [department, setDepartment] = useState("");
  const [gender, setGender] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);

  // Suggestions & recommendations states
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [recommendedHospitals, setRecommendedHospitals] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setDebounceQuery(query.trim());
      setPage(1); // Reset page on new search query
    }, 700);
    return () => clearTimeout(timeOut);
  }, [query]);

  // Main Doctors & Hospitals List States
  const [doctorsList, setDoctorsList] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchSearchData = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        // Fetch matching doctors
        const res = await fetch(
          `${BASE_URL}/doctors?query=${debounceQuery}&department=${department}&gender=${gender}&sortBy=${sortBy}&page=${page}&limit=8`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        setDoctorsList(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }

        // Fetch matching hospitals (filtered by same search term/department)
        const hospRes = await fetch(
          `${BASE_URL}/hospitals/recommendations?query=${debounceQuery}&specialty=${department}`
        );
        const hospJson = await hospRes.json();
        if (hospRes.ok) {
          setHospitalsList(hospJson.data.hospitals || []);
        }
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchSearchData();
  }, [debounceQuery, department, gender, sortBy, page]);

  // Fetch Defaults / Recommendations on mount
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch(`${BASE_URL}/doctors?limit=8&sortBy=rating`);
        const json = await res.json();
        if (res.ok) {
          setRecommendedDoctors(json.data || []);
        }

        const hRes = await fetch(`${BASE_URL}/hospitals/recommendations`);
        const hJson = await hRes.json();
        if (hRes.ok) {
          setRecommendedHospitals(hJson.data.hospitals || []);
        }
      } catch (e) {
        console.log("Error loading recommended lists:", e.message);
      }
    };
    fetchRecommended();
  }, []);

  const handleResetFilters = () => {
    setQuery("");
    setDebounceQuery("");
    setDepartment("");
    setGender("");
    setSortBy("");
    setPage(1);
  };

  return (
    <>
      <section className="bg-gray-50 py-12">
        <div className="container text-center max-w-[1170px] mx-auto px-4">
          <h2 className="heading text-3xl font-bold text-headingColor">Find Specialists & Partner Hospitals</h2>
          <p className="text-textColor text-sm mt-2 mb-8">
            Explore partner clinical branches and book direct or telemedicine appointments with verified medical specialists.
          </p>

          <div className="max-w-[760px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input Container with Suggestion Panel */}
            <div className="relative w-full md:flex-1 text-left">
              <input
                type="search"
                className="py-2.5 px-4 bg-gray-50 border rounded-md w-full focus:outline-none focus:border-primaryColor text-sm text-textColor"
                placeholder="Search by name, specialization, or department..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 220)}
              />

              {isFocused && recommendedDoctors.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3 space-y-2 text-left">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-1">Quick Suggestions</p>
                  <div className="divide-y divide-gray-50 max-h-[220px] overflow-y-auto">
                    {recommendedDoctors.slice(0, 5).map((doc) => (
                      <div 
                        key={doc._id} 
                        onClick={() => { setQuery(doc.name); setDebounceQuery(doc.name); }}
                        className="flex items-center gap-3 py-2 px-1 hover:bg-teal-50/30 rounded-lg cursor-pointer transition-all"
                      >
                        <img src={doc.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-bold text-headingColor">{doc.name}</p>
                          <p className="text-[10px] text-textColor">{doc.specialization} • {doc.ticketPrice} INR</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="py-2.5 px-3 bg-white border rounded-md text-sm text-textColor focus:outline-none focus:border-primaryColor w-full md:w-44"
            >
              <option value="">Department</option>
              <option value="General Medicine">General Medicine</option>
              <option value="General Surgery">General Surgery</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Orthopedics">Orthopedics</option>
            </select>

            {/* Gender Filter */}
            <select
              value={gender}
              disabled={activeTab === "hospitals"}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              className="py-2.5 px-3 bg-white border rounded-md text-sm text-textColor focus:outline-none focus:border-primaryColor w-full md:w-32 disabled:opacity-50"
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              disabled={activeTab === "hospitals"}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="py-2.5 px-3 bg-white border rounded-md text-sm text-textColor focus:outline-none focus:border-primaryColor w-full md:w-36 disabled:opacity-50"
            >
              <option value="">Sort By</option>
              <option value="priceAsc">Fee: Low to High</option>
              <option value="priceDesc">Fee: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tabs Selection */}
      <section className="pt-8 pb-4">
        <div className="container max-w-[1170px] mx-auto px-4 flex justify-center gap-4">
          <button
            onClick={() => setActiveTab("specialists")}
            className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-sm transition-all ${
              activeTab === "specialists"
                ? "bg-primaryColor text-white"
                : "bg-white text-headingColor border border-gray-200 hover:bg-gray-50"
            }`}
          >
            🧑‍⚕️ Specialists ({debounceQuery || department || gender ? doctorsList.length : "All"})
          </button>
          <button
            onClick={() => setActiveTab("hospitals")}
            className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-sm transition-all ${
              activeTab === "hospitals"
                ? "bg-primaryColor text-white"
                : "bg-white text-headingColor border border-gray-200 hover:bg-gray-50"
            }`}
          >
            🏥 Partner Branches ({debounceQuery || department ? hospitalsList.length : "All"})
          </button>
        </div>
      </section>

      <section className="py-8">
        <div className="container max-w-[1170px] mx-auto px-4">
          {fetchLoading && <Loader />}
          {fetchError && <ErrorComponent errMsg={fetchError} />}

          {!fetchLoading && !fetchError && (
            <>
              {activeTab === "specialists" ? (
                /* Tab 1: Specialists list */
                doctorsList.length === 0 ? (
                  <div className="space-y-8 py-10">
                    <div className="text-center max-w-[600px] mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                      <p className="font-extrabold text-red-700 text-sm">
                        No doctors found matching your criteria.
                      </p>
                      <p className="text-xs text-textColor mt-1">
                        We couldn't find matches for your active filters. Explore some of our top-rated recommended doctors instead:
                      </p>
                      <button 
                        onClick={handleResetFilters} 
                        className="mt-3.5 text-xs text-primaryColor hover:underline font-bold"
                      >
                        Clear All Search Filters
                      </button>
                    </div>

                    {recommendedDoctors.length > 0 && (
                      <div className="space-y-6 pt-4">
                        <h3 className="text-sm font-extrabold text-headingColor text-center uppercase tracking-widest text-primaryColor">
                          ✨ Recommended Specialists
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {recommendedDoctors.map((doctor) => (
                            <DoctorCard doctor={doctor} key={doctor._id} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {doctorsList.map((doctor) => (
                      <DoctorCard doctor={doctor} key={doctor._id} />
                    ))}
                  </div>
                )
              ) : (
                /* Tab 2: Partner Branches list */
                hospitalsList.length === 0 ? (
                  <div className="space-y-8 py-10">
                    <div className="text-center max-w-[600px] mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                      <p className="font-extrabold text-red-700 text-sm">
                        No clinical branches found matching your search.
                      </p>
                      <p className="text-xs text-textColor mt-1">
                        Try modifying your symptoms query or clear active department filters. Here are some of our top-rated medical centers:
                      </p>
                      <button 
                        onClick={handleResetFilters} 
                        className="mt-3.5 text-xs text-primaryColor hover:underline font-bold"
                      >
                        Clear All Search Filters
                      </button>
                    </div>

                    {recommendedHospitals.length > 0 && (
                      <div className="space-y-6 pt-4">
                        <h3 className="text-sm font-extrabold text-headingColor text-center uppercase tracking-widest text-primaryColor">
                          ✨ Featured Partner Centers
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {recommendedHospitals.slice(0, 4).map((h) => (
                            <HospitalCard hospital={h} key={h._id} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {hospitalsList.map((h) => (
                      <HospitalCard hospital={h} key={h._id} />
                    ))}
                  </div>
                )
              )}

              {/* Pagination Controls */}
              {activeTab === "specialists" && pagination.pages > 1 && doctorsList.length > 0 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                    className="px-4 py-2 border rounded-md text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-textColor font-semibold">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="px-4 py-2 border rounded-md text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="container max-w-[1170px] mx-auto px-4 mt-20">
          <div className="max-w-[470px] mx-auto mb-10">
            <h2 className="heading text-center font-bold text-2xl">What our patients say</h2>
            <p className="text_para text-center text-textColor text-sm mt-2">
              Discover what our patients are saying about their experiences with us through testimonials.
            </p>
          </div>
          <Testimonials />
        </div>
      </section>
    </>
  );
};

export default Doctors;
