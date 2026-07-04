import prisma from "../utils/prismaClient.js";

//get all reviews
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { patient: { select: { name: true } } },
    });
    res
      .status(200)
      .json({ success: true, message: "Successful", data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: "Not found" });
  }
};

//create review
export const createReview = async (req, res) => {
  const doctorId = req.params.doctorId || req.body.doctor;

  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.userId },
    });
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const savedReview = await prisma.review.create({
      data: {
        doctorId,
        patientId: patient.id,
        reviewText: req.body.reviewText,
        rating: Number(req.body.rating),
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Review submitted", data: savedReview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
