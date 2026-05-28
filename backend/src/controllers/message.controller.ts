import { Types } from "mongoose";
import type { Request, Response } from "express";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface ContactsQuery {
  search?: string;
  limit?: number;
}

interface MessagesQuery {
  before?: string;
  limit?: number;
}

export const getAllContacts = async (
  req: Request<{}, {}, {}, ContactsQuery>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const loggedUserId = req.user._id;
    const { search, limit = 50 } = req.query;

    const query: Record<string, unknown> = { _id: { $ne: loggedUserId } };

    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { fullName: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .limit(limit)
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      message: "All contacts successfully fetched",
      data: users,
    });
  } catch (error) {
    console.error("getAllContacts", error);
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

    const partners = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: loggedUserId }, { receiverId: loggedUserId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", loggedUserId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessageAt: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          fullName: "$user.fullName",
          email: "$user.email",
          profilePicture: "$user.profilePicture",
          lastMessageAt: 1,
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "All chats successfully fetched",
      data: partners,
    });
  } catch (error) {
    console.error("getChatPartners", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getMessagesByUserId = async (
  req: Request<{ id: string }, {}, {}, MessagesQuery>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const myId = req.user._id;
    const { id } = req.params;
    const { before, limit = 50 } = req.query;

    const filter: Record<string, unknown> = {
      $or: [
        { senderId: myId, receiverId: id },
        { senderId: id, receiverId: myId },
      ],
    };

    if (before) {
      filter._id = { $lt: new Types.ObjectId(before) };
    }

    const docs = await Message.find(filter)
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    const messages = docs.reverse();

    res.status(200).json({
      success: true,
      message: "Messages found",
      data: messages,
      nextCursor: docs.length === limit ? docs[0]?._id : null,
    });
  } catch (error) {
    console.error("getMessagesByUserId", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

interface SendMessageBody {
  text?: string;
  image?: string;
}

export const sendMessage = async (
  req: Request<{ id: string }, {}, SendMessageBody>,
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

    if (senderId.equals(receiverId)) {
      res.status(400).json({
        success: false,
        message: "You cannot message yourself",
      });
      return;
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      res.status(404).json({
        success: false,
        message: "Receiver does not exist",
      });
      return;
    }

    let imageUrl: string | undefined;
    if (image) {
      const upload = await cloudinary.uploader.upload(image, {
        folder: "astrotalk/messages",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });
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
  } catch (error) {
    console.error("sendMessage", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
