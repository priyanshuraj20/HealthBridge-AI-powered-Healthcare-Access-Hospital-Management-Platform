import sendEmail from "./sendEmail.js";

export const sendBookingNotification = async (booking, user, doctor) => {
  const subject = "Appointment Booking Received";
  const message = `Dear ${user.name},\n\nWe have received your booking request for Dr. ${doctor.name} on ${booking.appointmentDate} at ${booking.timeSlot.startingTime} (${booking.timeSlot.day}).\n\nYour appointment is currently pending confirmation. Once approved, you will receive another notification.\n\nThank you for choosing Medicare.`;
  
  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};

export const sendConfirmationNotification = async (booking, user, doctor) => {
  const subject = "Appointment Confirmed!";
  const message = `Dear ${user.name},\n\nGreat news! Your appointment with Dr. ${doctor.name} on ${booking.appointmentDate} at ${booking.timeSlot.startingTime} (${booking.timeSlot.day}) has been confirmed.\n\nPlease arrive 10 minutes prior to your scheduled time.\n\nThank you,\nMedicare Team`;

  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};

export const sendCancellationNotification = async (booking, user, doctor, initiator = "patient") => {
  const subject = "Appointment Cancelled";
  const party = initiator === "patient" ? "you" : `Dr. ${doctor.name}`;
  const message = `Dear ${user.name},\n\nThis is to notify you that the appointment scheduled with Dr. ${doctor.name} on ${booking.appointmentDate} at ${booking.timeSlot.startingTime} has been cancelled by ${party}.\n\nIf you have any questions or would like to reschedule, please visit your patient dashboard.\n\nBest regards,\nMedicare Team`;

  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};

export const sendReminderNotification = async (booking, user, doctor) => {
  const subject = "Appointment Reminder - Tomorrow";
  const message = `Dear ${user.name},\n\nThis is a friendly reminder that you have an upcoming appointment tomorrow, ${booking.appointmentDate}, with Dr. ${doctor.name} at ${booking.timeSlot.startingTime}.\n\nWe look forward to seeing you.\n\nBest regards,\nMedicare Team`;

  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};
