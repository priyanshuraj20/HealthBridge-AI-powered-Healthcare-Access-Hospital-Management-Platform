import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { authContext } from "../context/AuthContext.jsx";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const { dispatch } = useContext(authContext);

  const handleInputData = async (event) => {
    setFormData((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || "Login failed");
      }

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: resData.data,
          token: resData.token,
          role: resData.role,
        },
      });

      localStorage.setItem("token", resData.token);
      localStorage.setItem("role", resData.role);
      localStorage.setItem("user", JSON.stringify(resData.data));

      setLoading(false);
      toast.success(resData.message || "Logged in successfully");

      if (resData.role === "patient") {
        navigate("/users/profile/me");
      } else if (resData.role === "doctor") {
        navigate("/doctors/profile/me");
      } else if (resData.role === "org_admin") {
        navigate("/organization/dashboard");
      } else if (resData.role === "receptionist") {
        navigate("/hospital/reception");
      } else if (resData.role === "lab_tech") {
        navigate("/hospital/lab");
      } else if (resData.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/home");
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotLoading(false);
      if (!res.ok) {
        throw new Error(data.message);
      }
      toast.success(data.message || "Reset link generated successfully.");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err) {
      toast.error(err.message);
      setForgotLoading(false);
    }
  };

  return (
    <div>
      {/* ─── Moving Features Line (just below header, thoda patla) ─── */}
      <div className="w-full bg-[#f3faf9] border-b border-teal-100 overflow-hidden py-2 shadow-sm">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
          {[
            { ico: "🩺", text: "AI Symptom Checker" },
            { ico: "📄", text: "Report Analyzer" },
            { ico: "🎥", text: "Video Consultation" },
            { ico: "💰", text: "Cost Comparison" },
            { ico: "🏥", text: "Insurance Checker" },
            { ico: "🚑", text: "Emergency Triage" },
            { ico: "📅", text: "Smart Appointments" },
            { ico: "🔔", text: "Medicine Reminder" },
            { ico: "👨‍👩‍👧", text: "Family Health Vault" },
            { ico: "📈", text: "Recovery Tracker" }
          ].concat([
            { ico: "🩺", text: "AI Symptom Checker" },
            { ico: "📄", text: "Report Analyzer" },
            { ico: "🎥", text: "Video Consultation" },
            { ico: "💰", text: "Cost Comparison" },
            { ico: "🏥", text: "Insurance Checker" },
            { ico: "🚑", text: "Emergency Triage" },
            { ico: "📅", text: "Smart Appointments" },
            { ico: "🔔", text: "Medicine Reminder" },
            { ico: "👨‍👩‍👧", text: "Family Health Vault" },
            { ico: "📈", text: "Recovery Tracker" }
          ]).map((feat, idx) => (
            <span key={idx} className="inline-flex items-center gap-2 text-[11px] font-bold text-teal-800 uppercase tracking-wider">
              <span>{feat.ico}</span>
              <span>{feat.text}</span>
              <span className="text-teal-300 ml-4">•</span>
            </span>
          ))}
        </div>
      </div>

      <section className="px-4 py-20 bg-gray-50 flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-[480px] bg-white border border-gray-150 rounded-2xl shadow-sm p-8 md:p-10">
          <div className="text-center mb-8 border-b pb-6">
            <h3 className="text-headingColor text-2xl font-extrabold">Welcome Back</h3>
            <p className="text-xs text-textColor mt-1.5">Sign in to access your HealthBridge account</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              name="email"
              value={formData.email}
              onChange={handleInputData}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor focus:bg-white text-sm text-headingColor placeholder:text-textColor transition-all"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-headingColor uppercase tracking-wide">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] font-bold text-primaryColor hover:underline"
              >
                Forgot?
              </button>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              name="password"
              value={formData.password}
              onChange={handleInputData}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor focus:bg-white text-sm text-headingColor placeholder:text-textColor transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full btn rounded-xl py-3 text-sm font-semibold transition-all mt-6"
            disabled={loading}
          >
            {loading ? <HashLoader size={20} color="#fff" /> : "Sign In"}
          </button>

          <p className="text-xs text-textColor text-center mt-6">
            New to HealthBridge?{" "}
            <Link className="text-primaryColor font-bold hover:underline" to="/signup">
              Create an account
            </Link>
          </p>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-[420px] border">
            <h4 className="text-lg font-bold text-headingColor mb-2 border-b pb-3">Reset Password</h4>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-textColor block mb-1">
                  Enter your email to receive a secure reset link:
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-textColor hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 bg-primaryColor text-white rounded-lg text-xs font-semibold hover:opacity-95"
                >
                  {forgotLoading ? "Sending..." : "Send Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  </div>
  );
};

export default Login;
