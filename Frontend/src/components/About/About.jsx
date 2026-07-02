import { Link } from "react-router-dom";
import { AiOutlineCheckCircle, AiOutlineDashboard, AiOutlineDollar } from "react-icons/ai";

const About = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container max-w-[1280px] mx-auto px-4">
        <div className="flex justify-between gap-12 flex-col lg:flex-row items-center">
          {/* Left Panel: Clean Tailwind dashboard card instead of old images */}
          <div className="w-full lg:w-1/2 max-w-[540px]">
            <div className="bg-gray-50 border p-6 rounded-2xl shadow-sm space-y-6">
              <div className="border-b pb-4">
                <span className="text-xs uppercase font-bold text-gray-400 block mb-1">HealthBridge Credentials</span>
                <h3 className="font-extrabold text-headingColor text-xl">National Healthcare Access</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3.5 items-start">
                  <div className="bg-teal-50 text-primaryColor p-2.5 rounded-lg">
                    <AiOutlineCheckCircle size={22} />
                  </div>
                  <div>
                    <h5 className="font-bold text-headingColor text-sm">PM-JAY Scheme Compliance</h5>
                    <p className="text-xs text-textColor mt-1 leading-5">
                      Fully integrated with Ayushman Bharat rules for 100% cashless verification procedures.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg">
                    <AiOutlineDollar size={22} />
                  </div>
                  <div>
                    <h5 className="font-bold text-headingColor text-sm">Transparent Cost Modeling</h5>
                    <p className="text-xs text-textColor mt-1 leading-5">
                      No hidden fees. Check out-of-pocket estimations and compare generic drug alternatives instantly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="bg-cyan-50 text-cyan-600 p-2.5 rounded-lg">
                    <AiOutlineDashboard size={22} />
                  </div>
                  <div>
                    <h5 className="font-bold text-headingColor text-sm">Live Resource Allocation</h5>
                    <p className="text-xs text-textColor mt-1 leading-5">
                      Check real-time ICU and emergency room bed counts before commuting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-150 flex justify-between text-center">
                <div>
                  <span className="text-lg font-extrabold text-primaryColor">14K+</span>
                  <span className="text-[10px] text-textColor block mt-0.5">Patients Served</span>
                </div>
                <div className="border-r border-gray-200"></div>
                <div>
                  <span className="text-lg font-extrabold text-headingColor">24/7</span>
                  <span className="text-[10px] text-textColor block mt-0.5">AI Assistance</span>
                </div>
                <div className="border-r border-gray-200"></div>
                <div>
                  <span className="text-lg font-extrabold text-primaryColor">100%</span>
                  <span className="text-[10px] text-textColor block mt-0.5">Cashless Triage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Rebranded Text */}
          <div className="w-full lg:w-1/2 space-y-6">
            <h2 className="heading text-3xl font-extrabold leading-10 text-headingColor">
              Leading the Way in Affordable & Accessible Healthcare
            </h2>
            <p className="text_para text-sm leading-6 mt-4">
              At HealthBridge, we are dedicated to resolving clinical transparency problems. 
              By combining AI guides with live hospital bed counts, scheme checkers, and local doctor search features, we put healthcare decision-making back into the hands of the patient.
            </p>
            <p className="text_para text-sm leading-6">
              Our platform bridges the gap between patient budgets, insurance policies, and clinical resources, ensuring a smooth, cost-efficient medical experience.
            </p>
            <Link to="/affordability">
              <button className="btn rounded-full px-6 text-sm">Explore Affordability</button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
