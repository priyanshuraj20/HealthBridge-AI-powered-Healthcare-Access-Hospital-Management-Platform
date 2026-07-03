import { useState, useRef, useContext } from "react";
import userImg from "../../assets/images/defaultUser.jpg";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { BiMenu, BiX, BiSearch } from "react-icons/bi";
import { authContext } from "../../context/AuthContext.jsx";
import { t } from "../../utils/translate.js";

const navLinks = [
  { path: "/home",         display: "Home" },
  { path: "/doctors",      display: "Find Hospitals" },
  { path: "/video-call",   display: "Telemedicine" },
  { path: "/affordability",display: "Affordability" },
  { path: "/ai-guides",    display: "AI Assistant" },
  { path: "/contact",      display: "Contact" },
];

const Header = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  let [menuStatus, setMenuStatus] = useState(false);
  const menuRef = useRef(null);
  const { user, role, token } = useContext(authContext);

  const toggleMenu = () => {
    setMenuStatus(!menuStatus);
    menuRef.current.classList.toggle("show_menu");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/doctors?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="header flex items-center bg-white shadow-sm h-20">
      <div className="container max-w-[1280px] mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Working custom SVG logo for HealthBridge */}
          <div>
            <Link to="/home" className="flex items-center gap-2.5">
              <svg
                className="w-8 h-8 text-primaryColor"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3"
                ></path>
              </svg>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-primaryColor tracking-tight leading-tight">
                  Health<span className="text-headingColor">Bridge</span>
                </span>
                <span className="text-[9px] text-textColor font-medium tracking-wide uppercase leading-none">
                  AI-powered Access & Care
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="navigation" ref={menuRef}>
            <ul className="menu flex gap-[2.7rem] items-center">
              {navLinks.map((link, idx) => (
                <li key={idx}>
                  <NavLink
                    to={link.path}
                    className={(navClass) =>
                      navClass.isActive
                        ? "text-primaryColor text-[15px] leading-7 font-[600]"
                        : "text-textColor text-[15px] leading-7 font-[500] hover:text-primaryColor"
                    }
                  >
                    {t(link.display)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-4">
            
            {/* Header Search bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 bg-[#f3f4f6] border border-gray-200 rounded-lg px-3 py-1 focus-within:border-primaryColor transition-all">
              <BiSearch className="text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search hospitals, treatments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-[11px] text-headingColor focus:outline-none w-36 lg:w-44 font-medium"
              />
            </form>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full border border-gray-200">
              <button
                onClick={() => {
                  localStorage.setItem("lang", "en");
                  window.location.reload();
                }}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all leading-none ${
                  (localStorage.getItem("lang") || "en") === "en"
                    ? "bg-primaryColor text-white shadow-sm"
                    : "text-textColor hover:text-headingColor"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("lang", "hi");
                  window.location.reload();
                }}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all leading-none ${
                  localStorage.getItem("lang") === "hi"
                    ? "bg-primaryColor text-white shadow-sm"
                    : "text-textColor hover:text-headingColor"
                }`}
              >
                HI
              </button>
            </div>

            {token && user ? (
              <div>
                <Link
                  className="flex items-center gap-2"
                  to={`${
                    role === "org_admin"
                      ? "/organization/dashboard"
                      : role === "admin"
                      ? "/admin/dashboard"
                      : "/users/profile/me"
                  }`}
                >
                  <figure className="w-[35px] h-[35px] rounded-full overflow-hidden border border-primaryColor">
                    <img
                      src={user?.photo || userImg}
                      alt="userImg"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </figure>
                </Link>
              </div>
            ) : (
              <div>
                <Link to="/login">
                  <button className="bg-primaryColor text-white py-2 px-6 font-semibold h-9 flex items-center rounded-full text-sm">
                    Login
                  </button>
                </Link>
              </div>
            )}
            <span className="bar" onClick={toggleMenu}>
              {!menuStatus ? (
                <BiMenu className="w-8 h-8 cursor-pointer" />
              ) : (
                <BiX className="w-8 h-8 cursor-pointer" />
              )}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
