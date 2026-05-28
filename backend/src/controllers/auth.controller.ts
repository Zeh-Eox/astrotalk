import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { ENV } from "../lib/env.js";
import type {
  SignupInput,
  LoginInput,
  UpdateProfileInput,
} from "../schemas/auth.schema.js";

const BCRYPT_ROUNDS = 12;

export const signup = async (
  req: Request<{}, {}, SignupInput>,
  res: Response
): Promise<void> => {
  const { fullName, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409).json({
        success: false,
        message: "User already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    generateToken(newUser._id, res);

    sendWelcomeEmail(newUser.email, newUser.fullName, ENV.CLIENT_URL).catch(
      (err) => console.error("Welcome email failed:", err)
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        profilePicture: newUser.profilePicture,
      },
    });
  } catch (e: any) {
    if (e?.code === 11000) {
      res.status(409).json({
        success: false,
        message: "Email already exists",
      });
      return;
    }

    console.error("Error creating user", e);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    generateToken(user._id, res);

    res.status(200).json({
      success: true,
      message: "Login successfully",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error logging user", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const logout = async (_: Request, res: Response): Promise<void> => {
  res.cookie("jwt", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: "strict",
    secure: ENV.NODE_ENV === "production",
  });

  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
};

export const updateProfile = async (
  req: Request<{}, {}, UpdateProfileInput>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { profilePicture } = req.body;

    const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
      folder: "astrotalk/avatars",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: uploadResponse.secure_url },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Updated user",
      data: updatedUser,
    });
  } catch (e) {
    console.error("Error updating profile", e);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const isAuthenticated = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Not Authenticated",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    data: req.user,
  });
};
