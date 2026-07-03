import { BASE_URL } from "../../config";
import DoctorCard from "../../components/Doctors/DoctorCard";
import Testimonials from "../../components/Testimonials/Testimonials";
import ErrorComponent from "../../components/Error/Error.jsx";
import Loader from "../../components/Loader/Loading.jsx";
import { useEffect, useState } from "react";

const Doctors = () => {
  const [query, setQuery] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");

  // Filters
  const [department, setDepartment] = useState("");
  const [gender, setGender] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);

  // Suggestions & recommendations states
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setDebounceQuery(query.trim());
      setPage(1); // Reset page on new search query
    }, 700);
    return () => clearTimeout(timeOut);
  }, [query]);

  // Main Doctors Search List States
  const [doctorsList, setDoctorsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(
          `${BASE_URL}/doctors?query=${debounceQuery}&department=${department}&gender=${gender}&sortBy=${sortBy}&page=${page}&limit=8`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);

        setDoctorsList(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchDoctors();
  }, [debounceQuery, department, gender, sortBy, page]);

  // Fetch Recommended Doctors on mount
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch(`${BASE_URL}/doctors?limit=4&sortBy=rating`);
        const json = await res.json();
        if (res.ok) {
          setRecommendedDoctors(json.data || []);
        }
      } catch (e) {
        console.log("Error loading recommended list:", e.message);
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
          <h2 className="heading text-3xl font-bold text-headingColor">Find a Specialist</h2>
          <p className="text-textColor text-sm mt-2 mb-8">
            Search for doctors and filter by department, gender, consultation fee, or rating.
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
                    {recommendedDoctors.map((doc) => (
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
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              className="py-2.5 px-3 bg-white border rounded-md text-sm text-textColor focus:outline-none focus:border-primaryColor w-full md:w-32"
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="py-2.5 px-3 bg-white border rounded-md text-sm text-textColor focus:outline-none focus:border-primaryColor w-full md:w-36"
            >
              <option value="">Sort By</option>
              <option value="priceAsc">Fee: Low to High</option>
              <option value="priceDesc">Fee: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-[1170px] mx-auto px-4">
          {fetchLoading && <Loader />}
          {fetchError && <ErrorComponent errMsg={fetchError} />}

          {!fetchLoading && !fetchError && (
            <>
              {doctorsList.length === 0 ? (
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
              )}

              {/* Pagination Controls */}
              {pagination.pages > 1 && doctorsList.length > 0 && (
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
