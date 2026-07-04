import jwt from "jsonwebtoken";
import prisma from "../utils/prismaClient.js";

export const authenticate = async (req, res, next) => {
  const authToken = req.headers.authorization;

  if (!authToken || !authToken.startsWith("Bearer")) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization denied" });
  }

  try {
    const token = authToken.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = decoded.id;
    req.role = decoded.role;
    req.hospital = decoded.hospital || null;

    next();
  } catch (err) {
    if (err === "TokenExpiredError") {
      return res.status(401).json({ message: "Token is expired" });
    }
    return res.status(401).json({ success: false, message: "You are not authorized" });
  }
};

export const restrict = (roles) => async (req, res, next) => {
  const userId = req.userId;
  try {
    // Users (patient / org_admin / admin / receptionist / lab_tech) carry an explicit role column.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    let role = user?.role;

    // Doctors live in their own table and have an implicit "doctor" role.
    if (!user) {
      const doctor = await prisma.doctor.findUnique({ where: { id: userId } });
      if (doctor) role = "doctor";
    }

    if (!role || !roles.includes(role)) {
      return res
        .status(401)
        .json({ success: false, message: "You are not authorized" });
    }
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "You are not authorized" });
  }
};

