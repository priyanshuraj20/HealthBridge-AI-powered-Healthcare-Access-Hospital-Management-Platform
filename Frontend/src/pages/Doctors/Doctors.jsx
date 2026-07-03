import { BASE_URL } from "../../config";
import useFetchData from "../../hooks/useFetchData.js";
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

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setDebounceQuery(query.trim());
      setPage(1); // Reset page on new search query
    }, 700);
    return () => clearTimeout(timeOut);
  }, [query]);

  const fetchUrl = `${BASE_URL}/doctors?query=${debounceQuery}&department=${department}&gender=${gender}&sortBy=${sortBy}&page=${page}&limit=8`;
  const { data: resData, loading, error } = useFetchData(fetchUrl);

  // Extract doctors list and pagination metadata
  const doctors = resData || [];
  // Since useFetchData returns the top level response or result.data, let's see:
  // Our getAllDoctors backend response sends { success: true, data: doctors, pagination: { total, page, limit, pages } }
  // Wait, in useFetchData:
  // result.data is loaded into state!
  // If result.data is the array of doctors, wait, in our backend we did:
  // res.status(200).json({ success: true, data: doctors, pagination: ... })
  // So result.data is indeed the array of doctors! And pagination metadata is not returned by the hook since the hook returns result.data.
  // Wait! To get pagination metadata, we should handle custom fetches or update the useFetchData hook to return the entire response wrapper, or we can just fetch pagination metadata directly.
  // Actually, we can fetch page details easily or query them. Or we can update useFetchData to return the whole body, or simply perform standard client-side pagination on the returned dataset.
  // Wait, if the hook returns the array of doctors, let's check how we can do pagination. If we do client-side pagination of the returned list, or let the backend return all matching and we page on client, that is also robust.
  // But wait! In our backend `getAllDoctors` we implemented page and limit in Mongoose. If we did, then the returned array size is at most 8! So client-side pagination of the returned array wouldn't know the total count.
  // To handle pagination cleanly without changing all other files that use `useFetchData`, we can look at the hook:
  // setData(result.data).
  // If we modify the backend `getAllDoctors` to send data as an object `{ doctors, total, pages }` or similar? No, because other pages in the app (like `admin/src/components/Doctors.jsx` or customer dashboard lists) expect `data` to be an array of doctors!
  // Wait! A very elegant way is to let `useFetchData` work as is, but in `Doctors.jsx` we can use a custom local `fetch` request instead of the hook!
  // Yes! Performing a local `fetch` request inside a `useEffect` inside `Doctors.jsx` gives us 100% control over the entire API response (including `data` array and `pagination` object) and is completely safe from breaking other files!
  // Let's write the fetch logic directly in `Doctors.jsx` using `useEffect`! This is incredibly robust, clean, and professional.

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

  return (
    <>
      <section className="bg-gray-50 py-12">
        <div className="container text-center max-w-[1170px] mx-auto px-4">
          <h2 className="heading text-3xl font-bold text-headingColor">Find a Specialist</h2>
          <p className="text-textColor text-sm mt-2 mb-8">
            Search for doctors and filter by department, gender, consultation fee, or rating.
          </p>

          <div className="max-w-[760px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <input
              type="search"
              className="py-2.5 px-4 bg-gray-50 border rounded-md w-full md:flex-1 focus:outline-none focus:border-primaryColor text-sm text-textColor"
              placeholder="Search by name, specialization, or department..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

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
                <p className="text-center font-semibold text-lg text-red-500 py-10">
                  No doctors found matching your criteria.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {doctorsList.map((doctor) => (
                    <DoctorCard doctor={doctor} key={doctor._id} />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {pagination.pages > 1 && (
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
