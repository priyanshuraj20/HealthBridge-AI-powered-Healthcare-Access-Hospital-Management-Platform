import prisma from "../utils/prismaClient.js";

export const getAllMessages = async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const newMessage = async (req, res) => {
  try {

    const { name, email, subject, message } = req.body;
    await prisma.contactMessage.create({
      data: { name, email, subject, message },
    });
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
