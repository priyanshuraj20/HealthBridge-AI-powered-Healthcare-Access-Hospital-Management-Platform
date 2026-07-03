import User from "../models/UserSchema.js";
import Doctor from "../models/DoctorSchema.js";
import Organization from "../models/OrganizationSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const genToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, hospital: user.hospital || null },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
    }
  );
};

export const register = async (req, res) => {
  const { name, email, password, role, taxId } = req.body;
  try {
    let exists = null;
    if (role === "patient") {
      exists = await User.findOne({ email });
    } else if (role === "org_admin") {
      exists = await Organization.findOne({ adminEmail: email });
    }

    if (exists) {
      return res.status(400).json({ message: "Account already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    if (role === "patient") {
      const patient = new User({
        name,
        email,
        password: hashPassword,
        role: "patient"
      });
      await patient.save();
    } else if (role === "org_admin") {
      if (!taxId) {
        return res.status(400).json({ message: "Tax ID is required for organization registration" });
      }
      const org = new Organization({
        name,
        taxId,
        adminEmail: email,
        password: hashPassword,
        role: "org_admin"
      });
      await org.save();
    } else {
      return res.status(400).json({ message: "Invalid role selected. Register as patient or org_admin." });
    }

    res.status(200).json({ success: true, message: "Account successfully created" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = null;
    user = await User.findOne({ email });

    if (!user) {
      const org = await Organization.findOne({ adminEmail: email });
      if (org) {
        user = {
          _id: org._id,
          name: org.name,
          email: org.adminEmail,
          password: org.password,
          role: org.role,
          _doc: { ...org._doc, email: org.adminEmail }
        };
      }
    }

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ success: false, message: "Invalid Credentials" });
    }

    const token = genToken(user);
    const data = user._doc || user;
    const { password: userPw, role, ...rest } = data;

    res.status(200).json({
      success: true,
      message: "Successfully Logged In",
      token,
      data: { ...rest },
      role,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Login failed" });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ status: false, message: "Invalid Credentials" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ status: false, message: "Unauthorized access. Admins only." });
    }

    const token = genToken(user);
    const { password: userPw, role, ...rest } = user._doc;
    res.status(200).json({
      success: true,
      message: "Successfully Logged In as Admin",
      token,
      data: { ...rest },
      role,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Admin login failed" });
  }
};

export const addAdmin = async (req, res) => {
  const { email, name } = req.body;
  try {
    const user = await User.findOne({ email, name });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(200).json({ success: true, message: "Already an admin" });
    }
    user.role = "admin";
    await user.save();
    return res.status(200).json({ success: true, message: "User role updated to admin", data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    let account = await User.findOne({ email });
    if (!account) {
      account = await Doctor.findOne({ email });
    }
    if (!account) {
      account = await Organization.findOne({ adminEmail: email });
    }

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const updateField = account.adminEmail ? "adminEmail" : "email";
    
    account.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    account.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await account.save();

    const resetUrl = `${process.env.CLIENT_SITE_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        email: account[updateField],
        subject: "Password Reset Request",
        message: `Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.`,
      });
      res.status(200).json({ success: true, message: "Password reset link sent to your email" });
    } catch (mailErr) {
      res.status(200).json({
        success: true,
        message: "Password reset token generated (skipped email delivery)",
        resetUrl,
      });
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
    let account = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    
    if (!account) {
      account = await Doctor.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    }
    if (!account) {
      account = await Organization.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    }

    if (!account) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(password, salt);
    account.resetPasswordToken = undefined;
    account.resetPasswordExpire = undefined;
    await account.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password reset failed" });
  }
};

