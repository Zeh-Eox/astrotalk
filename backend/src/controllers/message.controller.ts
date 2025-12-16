import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { Request, Response } from "express";

interface SendMessageBody {
  text?: string;
  image?: string;
}

interface GetMessagesParams {
  id: string;
}

interface SearchQuery {
  search?: string;
}

export const getAllContacts = async (
  req: Request<{}, {}, {}, SearchQuery>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const loggedUserId = req.user._id;
    const { search } = req.query;

    const query: any = { _id: { $ne: loggedUserId } };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("-password");

    res.status(200).json({
      success: true,
      message: "All contacts successfully fetched",
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getChatPartners = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const loggedUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedUserId }, { receiverId: loggedUserId }],
    }).sort({ createdAt: -1 });

    const partnerIds = [
      ...new Set(
        messages.map((m) =>
          m.senderId.equals(loggedUserId)
            ? m.receiverId.toString()
            : m.senderId.toString()
        )
      ),
    ];

    const partners = await User.find({
      _id: { $in: partnerIds },
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "All chats successfully fetched",
      data: partners,
    });
  } catch {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getMessagesByUserId = async (
  req: Request<GetMessagesParams>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const myId = req.user._id;
    const { id } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: id },
        { senderId: id, receiverId: myId },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Messages found",
      data: messages,
    });
  } catch {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const sendMessage = async (
  req: Request<GetMessagesParams, {}, SendMessageBody>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { text, image } = req.body;
    const senderId = req.user._id;
    const receiverId = req.params.id;

    if (!text && !image) {
      res.status(400).json({
        success: false,
        message: "Message must contain text or image",
      });
      return;
    }

    if (senderId.equals(receiverId)) {
      res.status(400).json({
        success: false,
        message: "You cannot message yourself",
      });
      return;
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      res.status(400).json({
        success: false,
        message: "Receiver does not exist",
      });
      return;
    }

    let imageUrl: string | undefined;
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imageUrl = upload.secure_url;
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    const sockets = getReceiverSocketId(receiverId);
    if (sockets) {
      for (const socketId of sockets) {
        io.to(socketId).emit("newMessage", message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Message successfully sent",
      data: message,
    });
  } catch {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};