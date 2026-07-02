import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BASE_URL } from "../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      toast.success(data.message || "Password updated successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <section className="px-4 md:pt-[80px] pb-[30px]">
      <div className="w-full max-w-[570px] mx-auto rounded-lg shadow-xl p-10 bg-white border border-gray-100">
        <h3 className="text-headingColor text-[22px] leading-9 font-bold mb-10 text-center">
          Reset Your <span className="text-primaryColor">Password</span>
        </h3>
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-headingColor block mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-b border-solid border-[#00000070] focus:outline-none focus:border-b-primaryColor text-[16px] leading-7 text-headingColor placeholder:text-textColor"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-headingColor block mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-b border-solid border-[#00000070] focus:outline-none focus:border-b-primaryColor text-[16px] leading-7 text-headingColor placeholder:text-textColor"
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primaryColor text-white text-[18px] leading-[30px] rounded-lg px-4 py-3 font-semibold hover:opacity-95 transition-all flex items-center justify-center"
            >
              {loading ? <HashLoader size={25} color="#fff" /> : "Update Password"}
            </button>
          </div>
          <p className="text-center text-sm mt-4 text-textColor">
            Remembered your password?{" "}
            <Link to="/login" className="text-primaryColor font-semibold">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;
