import prisma from "../utils/prismaClient.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const genToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "7d" }
  );
};

export const register = async (req, res) => {
  const { name, email, password, role, taxId } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Account already exists" });
    }

    if (!["patient", "org_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Register as patient or org_admin." });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    if (role === "patient") {
      await prisma.user.create({
        data: {
          email,
          passwordHash: hashPassword,
          role: "patient",
          patient: {
            create: { name, phone: req.body.phone || null }
          }
        }
      });
    } else if (role === "org_admin") {
      if (!taxId) {
        return res.status(400).json({ message: "Tax ID is required for organization registration" });
      }
      const existingOrg = await prisma.organization.findUnique({ where: { taxId } });
      if (existingOrg) {
        return res.status(400).json({ message: "Organization with this Tax ID already exists" });
      }
      await prisma.user.create({
        data: {
          email,
          passwordHash: hashPassword,
          role: "org_admin",
          organization: {
            create: { name, taxId }
          }
        }
      });
    }

    res.status(200).json({ success: true, message: "Account successfully created" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { patient: true, organization: { include: { hospitals: true } } }
    });

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return res.status(400).json({ success: false, message: "Invalid Credentials" });
    }

    const token = genToken(user);
    const { passwordHash, ...rest } = user;

    res.status(200).json({
      success: true,
      message: "Successfully Logged In",
      token,
      data: { ...rest, name: user.patient?.name || user.organization?.name },
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Login failed" });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) return res.status(400).json({ status: false, message: "Invalid Credentials" });

    if (user.role !== "admin") {
      return res.status(403).json({ status: false, message: "Unauthorized access. Admins only." });
    }

    const token = genToken(user);
    const { passwordHash, ...rest } = user;
    res.status(200).json({ success: true, message: "Successfully Logged In as Admin", token, data: rest, role: user.role });
  } catch (err) {
    res.status(500).json({ success: false, message: "Admin login failed" });
  }
};

export const addAdmin = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(200).json({ success: true, message: "Already an admin" });

    const updated = await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
    return res.status(200).json({ success: true, message: "User role updated to admin", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    let account = await prisma.user.findUnique({ where: { email } });
    if (!account) {
      const doctor = await prisma.doctor.findUnique({ where: { email } });
      if (doctor) {
        // Handle doctor password reset separately
        return res.status(200).json({ success: true, message: "Password reset for doctors is managed by the hospital." });
      }
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: account.id },
      data: { resetPasswordToken, resetPasswordExpire }
    });

    const resetUrl = `${process.env.CLIENT_SITE_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        email: account.email,
        subject: "Password Reset Request",
        message: `Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.`,
      });
      res.status(200).json({ success: true, message: "Password reset link sent to your email" });
    } catch (mailErr) {
      res.status(200).json({ success: true, message: "Password reset token generated", resetUrl });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error, try again" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    const account = await prisma.user.findFirst({
      where: { resetPasswordToken, resetPasswordExpire: { gt: new Date() } }
    });

    if (!account) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: account.id },
      data: { passwordHash: hashPassword, resetPasswordToken: null, resetPasswordExpire: null }
    });

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password reset failed" });
  }
};
