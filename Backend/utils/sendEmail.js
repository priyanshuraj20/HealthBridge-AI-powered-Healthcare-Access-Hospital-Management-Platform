import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // 1. Direct Mailtrap API Integration (if MAILTRAP_TOKEN is configured)
  if (process.env.MAILTRAP_TOKEN) {
    try {
      const response = await fetch("https://send.api.mailtrap.io/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MAILTRAP_TOKEN}`,
        },
        body: JSON.stringify({
          from: {
            email: process.env.MAILTRAP_SENDER || "hello@demomailtrap.co",
            name: "HealthBridge Portal",
          },
          to: [
            {
              email: options.email,
            },
          ],
          subject: options.subject,
          text: options.message,
          html: options.html || `<p>${options.message.replace(/\n/g, "<br>")}</p>`,
          category: "Portal Notification",
        }),
      });

      const resJson = await response.json();
      if (response.ok) {
        console.log("Email sent successfully via Mailtrap API to", options.email);
        return;
      } else {
        console.error("Mailtrap sending failed:", resJson);
      }
    } catch (err) {
      console.error("Mailtrap API connection error:", err.message);
    }
  }

  // 2. Fallback to standard SMTP
  const isConfigured =
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USERNAME &&
    process.env.EMAIL_PASSWORD;

  if (!isConfigured) {
    console.log("=========================================");
    console.log("SMTP / Mailtrap Environment Variables not fully configured.");
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log("=========================================");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"HealthBridge Portal" <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message.replace(/\n/g, "<br>")}</p>`,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
