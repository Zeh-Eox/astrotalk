import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
    try {
        const loggedUserId = req.user._id;
        const searchQuery = req.query.search;
        const query = { _id: { $ne: loggedUserId } };

        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const filteredUsers = await User.find(query).select("-password");

        return res.status(200).json({
            success: true,
            message: "All contacts successfully fetched",
            data: filteredUsers
        });
    } catch (e) {
        console.error("Failed to get all contacts", e);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const getChatPartners = async (req, res) => {
    try {
        const loggedUserId = req.user._id;

        const messages = await  Message.find({
            $or: [{ senderId: loggedUserId }, { receiverId: loggedUserId }]
        }).sort({createdAt: -1});

        const chatPartnerIds = [
            ...new Set(
                messages.map((message) =>
                    message.senderId.toString() === loggedUserId.toString()
                        ? message.receiverId.toString()
                        : message.senderId.toString()
                )
            )
        ]

        const chatPartners = await User.find({_id: {$in: chatPartnerIds}}).select("-password");

        return res.status(200).json({
            success: true,
            message: "All chats successfully fetched",
            data: chatPartners
        })
    } catch (e) {
        console.error("Failed to get chatPartners", e);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId},
            ]
        })

        return res.status(200).json({
            success: true,
            message: "Messages found",
            data: messages
        })
    } catch (e) {
        console.error("Failed to get messages", e);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({
                success: false,
                message: "Message must contain text or image"
            });
        }

        if (senderId.equals(receiverId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot message yourself"
            })
        }

        const receiverExists = await User.exists({ _id: receiverId });
        if (!receiverExists) {
            return res.status(400).json({
                success: false,
                message: "Receiver does not exist"
            })
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const message = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        await message.save();

        const receiverSocketIds = getReceiverSocketId(receiverId)
        
        if (receiverSocketIds) {
            for (const socketId of receiverSocketIds) {
                io.to(socketId).emit("newMessage", message);
            }
        }

        return res.status(201).json({
            success: true,
            message: "Message successfully sent",
            data: message
        });
    } catch (e) {
        console.error("Failed to send message", e);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}