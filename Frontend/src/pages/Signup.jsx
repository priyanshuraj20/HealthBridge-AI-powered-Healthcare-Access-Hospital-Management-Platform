import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import uploadImageToCloudinary from "../utils/uploadCloudinary.js";
import { BASE_URL } from "../config.js";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";

const Signup = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    photo: "",
    gender: "",
    role: "patient",
    taxId: "",
  });

  const navigate = useNavigate();

  const handleInputData = (event) => {
    setFormData((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const data = await uploadImageToCloudinary(file);
      setPreviewUrl(data.url);
      setSelectedFile(data.url);
      setFormData((prevState) => ({ ...prevState, photo: data.url }));
    } catch (e) {
      toast.error("File upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (formData.role === "patient" && !formData.gender) {
      toast.error("Please select a gender.");
      return;
    }
    if (formData.role === "org_admin" && !formData.taxId) {
      toast.error("Tax ID/License Number is required for hospitals.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || "Registration failed");
      }

      setLoading(false);
      toast.success(resData.message || "Registration successful");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
      setLoading(false);
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

      <section className="px-4 py-16 bg-gray-50 flex items-center justify-center min-h-[85vh]">
        <div className="w-full max-w-[500px] bg-white border border-gray-150 rounded-2xl shadow-sm p-8 md:p-10">
          <div className="text-center mb-8 border-b pb-6">
            <h3 className="text-headingColor text-2xl font-extrabold">Create Account</h3>
            <p className="text-xs text-textColor mt-1.5">Join HealthBridge to optimize your care & affordability</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
              {formData.role === "org_admin" ? "Hospital / Organization Name" : "Full Name"}
            </label>
            <input
              type="text"
              placeholder={formData.role === "org_admin" ? "Enter Hospital Name" : "Enter Your Name"}
              name="name"
              value={formData.name}
              onChange={handleInputData}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor focus:bg-white text-xs text-headingColor placeholder:text-textColor transition-all"
              required
            />
          </div>

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
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor focus:bg-white text-xs text-headingColor placeholder:text-textColor transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              name="password"
              value={formData.password}
              onChange={handleInputData}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor focus:bg-white text-xs text-headingColor placeholder:text-textColor transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
                Who are you?
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputData}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor bg-white"
              >
                <option value="patient">Patient</option>
                <option value="org_admin">Hospital / Clinic</option>
              </select>
            </div>

            {formData.role === "patient" ? (
              <div>
                <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputData}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-textColor bg-white"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-headingColor block mb-1.5 uppercase tracking-wide">
                  Tax ID / License No.
                </label>
                <input
                  type="text"
                  placeholder="Tax/License Number"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputData}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-primaryColor text-xs text-headingColor placeholder:text-textColor transition-all bg-white"
                  required
                />
              </div>
            )}
          </div>

          {/* Photo upload row */}
          {formData.role === "patient" && (
            <div className="pt-2 flex items-center gap-4">
              {selectedFile && (
                <figure className="w-[45px] h-[45px] rounded-full overflow-hidden border border-primaryColor flex-shrink-0">
                  <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                </figure>
              )}
              <div className="relative flex-1">
                <input
                  type="file"
                  name="photo"
                  id="customFile"
                  onChange={handleFileInputChange}
                  accept=".jpg, .png, .jpeg"
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
                <label
                  htmlFor="customFile"
                  className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-200 hover:border-primaryColor hover:bg-teal-50/10 text-xs font-semibold text-textColor rounded-xl cursor-pointer transition-all"
                >
                  {loading ? "Uploading image..." : "Upload Profile Avatar"}
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full btn rounded-xl py-3 text-sm font-semibold transition-all mt-6"
            disabled={loading}
          >
            {loading ? <HashLoader size={20} color="#fff" /> : "Register"}
          </button>

          <p className="text-xs text-textColor text-center mt-6">
            Already have an account?{" "}
            <Link className="text-primaryColor font-bold hover:underline" to="/login">
              Sign In
            </Link>
          </p>
        </form>
      </div>
      </section>
    </div>
  );
};

export default Signup;
