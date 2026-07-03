/* eslint-disable react/prop-types */
import { useState } from "react";
import convertTime from "../../utils/convertTime";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";

const SidePanel = ({ doctorId, ticketPrice, timeSlots }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [consultationType, setConsultationType] = useState("physical");

  const todayStr = new Date().toISOString().split("T")[0];

  const bookingHandler = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      toast.error("Please login to book an appointment.");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select an appointment date.");
      return;
    }

    if (selectedSlotIndex === "") {
      toast.error("Please select a time slot.");
      return;
    }

    const timeSlot = timeSlots[parseInt(selectedSlotIndex)];

    setBookingLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/checkout-session/${doctorId}`, {
        method: "post",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentDate: selectedDate,
          timeSlot,
          symptoms,
          consultationType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "An unexpected error occurred.");
      }

      const data = await res.json();
      setBookingLoading(false);
      if (data.session_url) {
        window.location.href = data.session_url;
      }
    } catch (err) {
      toast.error(err.message);
      setBookingLoading(false);
    }
  };

  return (
    <div className="flex flex-col shadow-panelShadow rounded-md p-6 bg-white border border-gray-100 h-fit">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
        <p className="text-sm font-bold text-textColor">Consultation Fee</p>
        <span className="text-xl text-headingColor font-bold">
          {ticketPrice} INR
        </span>
      </div>

      <div className="space-y-4">
        {/* Date Selector */}
        <div>
          <label className="text-sm font-semibold text-headingColor block mb-1">
            Choose Date *
          </label>
          <input
            type="date"
            min={todayStr}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2.5 border rounded-md focus:outline-none focus:border-primaryColor text-textColor text-sm bg-white"
            required
          />
        </div>

        {/* Time Slot Dropdown */}
        <div>
          <label className="text-sm font-semibold text-headingColor block mb-1">
            Choose Time Slot *
          </label>
          <select
            value={selectedSlotIndex}
            onChange={(e) => setSelectedSlotIndex(e.target.value)}
            className="w-full p-2.5 border rounded-md focus:outline-none focus:border-primaryColor text-textColor text-sm bg-white"
            required
          >
            <option value="">Select a time slot</option>
            {timeSlots?.map((time, index) => (
              <option key={index} value={index}>
                {time.day}: {convertTime(time.startingTime)} - {convertTime(time.endingTime)}
              </option>
            ))}
          </select>
        </div>

        {/* Consultation Mode */}
        <div>
          <label className="text-sm font-semibold text-headingColor block mb-1">
            Consultation Mode *
          </label>
          <div className="flex gap-4 p-2 bg-gray-50 rounded-md border">
            <label className="flex items-center gap-1.5 text-xs text-textColor font-semibold cursor-pointer">
              <input
                type="radio"
                name="consultationType"
                value="physical"
                checked={consultationType === "physical"}
                onChange={() => setConsultationType("physical")}
                className="accent-primaryColor"
              />
              In-Person Visit
            </label>
            <label className="flex items-center gap-1.5 text-xs text-textColor font-semibold cursor-pointer">
              <input
                type="radio"
                name="consultationType"
                value="video-instant"
                checked={consultationType === "video-instant"}
                onChange={() => setConsultationType("video-instant")}
                className="accent-primaryColor"
              />
              Video Consultation
            </label>
          </div>
        </div>

        {/* Symptoms Description */}
        <div>
          <label className="text-sm font-semibold text-headingColor block mb-1">
            Symptoms / Health Notes
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe symptoms briefly (e.g. fever, headache)"
            className="w-full p-2.5 border rounded-md focus:outline-none focus:border-primaryColor text-textColor text-sm"
            rows="2"
          ></textarea>
        </div>
      </div>

      <button
        onClick={bookingHandler}
        disabled={bookingLoading}
        className="btn w-full rounded-md mt-6 py-3 font-semibold text-sm transition-all"
      >
        {bookingLoading ? "Processing..." : "Book Appointment"}
      </button>
    </div>
  );
};

export default SidePanel;
