import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { authContext } from "../../context/AuthContext.jsx";
import HashLoader from "react-spinners/HashLoader";

export default function TelemedicineRedirect() {
  const navigate = useNavigate();
  const { token, role } = useContext(authContext);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (role === "doctor") {
      navigate("/doctors/profile/me");
    } else {
      navigate("/users/profile/me");
    }
  }, [token, role, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <HashLoader color="#0d9488" size={50} />
      <p className="text-sm font-semibold text-textColor">
        Redirecting you to your Telemedicine Consultations dashboard...
      </p>
    </div>
  );
}
