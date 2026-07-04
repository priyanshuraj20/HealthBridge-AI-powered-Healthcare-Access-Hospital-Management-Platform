import { useState, useContext, useEffect } from "react";
import { authContext } from "../../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import MyBookings from "./MyBookings.jsx";
import ProfileSettings from "./ProfileSettings.jsx";
import MedicalReports from "./MedicalReports.jsx";
import Prescriptions from "./Prescriptions.jsx";
import SymptomChecker from "./SymptomChecker.jsx";
import PrescriptionOCR from "./PrescriptionOCR.jsx";
import PatientHomepage from "./PatientHomepage.jsx";
import FamilyVault from "./FamilyVault.jsx";
import { t } from "../../utils/translate.js";
import useGetProfile from "../../hooks/useFetchData.js";
import { BASE_URL, token } from "../../config.js";
import Loading from "../../components/Loader/Loading.jsx";
import Error from "../../components/Error/Error.jsx";
import userPlaceholder from "../../assets/images/defaultUser.jpg";

const UserAccount = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [tab, setTab] = useState(queryParams.get("tab") || "homepage");
  const { dispatch } = useContext(authContext);

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get("tab");
    if (tabParam) {
      setTab(tabParam);
    }
  }, [location]);

  const {
    data: rawUser,
    loading,
    error,
  } = useGetProfile(`${BASE_URL}/users/profile/me`);

  // The API returns a User with a nested `patient` profile. Flatten it into a
  // single object the dashboard tabs can read, keeping the User id for updates
  // and mapping the normalized Ayushman columns back to the shape the UI uses.
  const patient = rawUser?.patient || {};
  const userData = rawUser
    ? {
        ...patient,
        id: rawUser.id,
        email: rawUser.email,
        role: rawUser.role,
        name: patient.name || rawUser.organization?.name || "",
        familyMembers: patient.familyMembers || [],
        ayushmanCard: {
          cardNumber: patient.ayushmanCardNo || "",
          holderName: patient.ayushmanName || "",
          status: patient.ayushmanStatus || "Unverified",
        },
      }
    : null;

  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/home");
    toast.success("You have successfully logged out");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account?");
    if (confirmed) {
      try {
        const res = await fetch(`${BASE_URL}/users/deleteUserAccount`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message);

        dispatch({ type: "LOGOUT" });
        navigate("/home");
        toast.success("Your account has been successfully deleted");
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  return (
    <section className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-[1170px] px-5 mx-auto">
        {loading && !error && <Loading />}
        {error && !loading && <Error errMsg={error} />}
        {!error && !loading && userData && (
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar Profile Card */}
            <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
              <div className="flex items-center justify-center">
                <figure className="w-[100px] h-[100px] rounded-full border-2 border-solid border-primaryColor overflow-hidden">
                  <img
                    src={userData.photo || userPlaceholder}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </figure>
              </div>
              <div className="text-center mt-4 pb-6 border-b border-gray-100">
                <h3 className="text-lg leading-6 text-headingColor font-bold">
                  {userData.name}
                </h3>
                <p className="text-textColor text-sm mt-1">{userData.email}</p>
                <p className="text-textColor text-xs mt-2 bg-indigo-50 text-indigo-700 px-2 py-1 rounded inline-block font-semibold">
                  Blood Group: {userData.bloodGroup || "N/A"}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleLogout}
                  className="w-full bg-[#181A1E] py-2.5 text-sm text-white font-semibold rounded-md hover:bg-black transition-all"
                >
                  Logout
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full bg-red-100 text-red-700 py-2.5 text-sm font-semibold rounded-md hover:bg-red-200 transition-all"
                >
                  Delete Account
                </button>
              </div>
            </div>

            {/* Dashboard Tabs & Content */}
            <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
                <button
                  onClick={() => setTab("homepage")}
                  className={`p-2 px-4 text-xs font-semibold rounded transition-all ${
                    tab === "homepage"
                      ? "bg-primaryColor text-white"
                      : "text-headingColor bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {t("Healthcare Home")}
                </button>
                <button
                  onClick={() => setTab("settings")}
                  className={`p-2 px-4 text-xs font-semibold rounded transition-all ${
                    tab === "settings"
                      ? "bg-primaryColor text-white"
                      : "text-headingColor bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {t("Profile Settings")}
                </button>
                <button
                  onClick={() => setTab("bookings")}
                  className={`p-2 px-4 text-xs font-semibold rounded transition-all ${
                    tab === "bookings"
                      ? "bg-primaryColor text-white"
                      : "text-headingColor bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {t("My Appointments")}
                </button>
                <button
                  onClick={() => setTab("reports")}
                  className={`p-2 px-4 text-xs font-semibold rounded transition-all ${
                    tab === "reports"
                      ? "bg-primaryColor text-white"
                      : "text-headingColor bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {t("Medical Reports")}
                </button>
                <button
                  onClick={() => setTab("prescriptions")}
                  className={`p-2 px-4 text-xs font-semibold rounded transition-all ${
                    tab === "prescriptions"
                      ? "bg-primaryColor text-white"
                      : "text-headingColor bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {t("Prescriptions")}
                </button>
                <button
                  onClick={() => setTab("symptoms")}
                  className={`p-2 px-4 text-xs font-semibold rounded transition-all ${
                    tab === "symptoms"
                      ? "bg-primaryColor text-white"
                      : "text-headingColor bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {t("Symptom Checker")}
                </button>
                <button
                  onClick={() => setTab("ocr")}
                  className={`p-2 px-4 text-xs font-semibold rounded transition-all ${
                    tab === "ocr"
                      ? "bg-primaryColor text-white"
                      : "text-headingColor bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {t("Prescription OCR")}
                </button>
                <button
                  onClick={() => setTab("family-vault")}
                  className={`p-2 px-4 text-xs font-semibold rounded transition-all ${
                    tab === "family-vault"
                      ? "bg-primaryColor text-white"
                      : "text-headingColor bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  👨‍👩‍👧 {t("Family & Ayushman Vault")}
                </button>
              </div>

              {/* Tab Outputs */}
              {tab === "homepage" && <PatientHomepage user={userData} setTab={setTab} />}
              {tab === "settings" && <ProfileSettings user={userData} />}
              {tab === "bookings" && <MyBookings />}
              {tab === "reports" && <MedicalReports />}
              {tab === "prescriptions" && <Prescriptions />}
              {tab === "symptoms" && <SymptomChecker />}
              {tab === "ocr" && <PrescriptionOCR />}
              {tab === "family-vault" && <FamilyVault user={userData} />}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserAccount;
