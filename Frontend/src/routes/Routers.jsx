import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Services from "../pages/Services";
import Contact from "../pages/Contact";
import Doctors from "../pages/Doctors/Doctors";
import DoctorDetails from "../pages/Doctors/DoctorDetails";
import UserAccount from "../Dashboard/user-account/MyAccount.jsx";
import DashBoard from "../Dashboard/doctor-account/Dashboard.jsx";
import AdminDashboard from "../Dashboard/admin-account/AdminDashboard.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import AffordabilityHub from "../pages/Affordability/AffordabilityHub.jsx";
import HealthBridgeAI from "../pages/Affordability/HealthBridgeAI.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import ScrollToTop from "../components/ScrollToTop/ScrollToTop.jsx";
import CheckoutSuccess from "../pages/CheckoutSuccess.jsx";
import VideoCall from "../pages/Telemedicine/VideoCall.jsx";
import TelemedicineRedirect from "../pages/Telemedicine/TelemedicineRedirect.jsx";
import OrgDashboard from "../pages/Hospital/OrgDashboard.jsx";
import ReceptionistQueue from "../pages/Hospital/ReceptionistQueue.jsx";
import LabTechPanel from "../pages/Hospital/LabTechPanel.jsx";



import { Routes, Route } from "react-router-dom";

const Routers = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/home" element={<Home />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/signup" element={<Signup />}></Route>
        <Route path="/services" element={<Services />}></Route>
        <Route path="/contact" element={<Contact />}></Route>
        <Route path="/doctors" element={<Doctors />}></Route>
        <Route path="/doctors/:id" element={<DoctorDetails />}></Route>
        <Route path="/verify" element={<CheckoutSuccess />}></Route>
        <Route path="/reset-password/:token" element={<ResetPassword />}></Route>
        <Route path="/affordability" element={<AffordabilityHub />}></Route>
        <Route
          path="/ai-guides"
          element={
            <ProtectedRoute allowedRoles={["patient", "admin"]}>
              <HealthBridgeAI />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/users/profile/me"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <UserAccount />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/doctors/profile/me"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DashBoard />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/video-call/:bookingId"
          element={
            <ProtectedRoute allowedRoles={["patient", "doctor"]}>
              <VideoCall />
            </ProtectedRoute>
          }
        ></Route>
        <Route path="/video-call" element={<TelemedicineRedirect />} />
        <Route
          path="/organization/dashboard"
          element={
            <ProtectedRoute allowedRoles={["org_admin"]}>
              <OrgDashboard />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/hospital/reception"
          element={
            <ProtectedRoute allowedRoles={["receptionist", "org_admin"]}>
              <ReceptionistQueue />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/hospital/lab"
          element={
            <ProtectedRoute allowedRoles={["lab_tech", "org_admin"]}>
              <LabTechPanel />
            </ProtectedRoute>
          }
        ></Route>
      </Routes>
    </>
  );
};

export default Routers;
