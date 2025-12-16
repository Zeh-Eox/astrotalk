import bcrypt from "bcryptjs";
import {generateToken} from "../lib/utils.js";
import type { Request, Response } from "express";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

interface SignupBody {
  fullName: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface UpdateProfileBody {
  profilePicture: string;
}

export const signup = async (
  req: Request<{}, {}, SignupBody>,
  res: Response
): Promise<void> => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Missing required field",
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
      return;
    }

    const emailRegex =
      /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({
        success: false,
        message: "User already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    generateToken(newUser._id, res);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        profilePicture: newUser.profilePicture,
      },
    });
    return;
  } catch (e: any) {
    console.error("Error creating user", e);

    if (e?.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Email already exists",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    return;
  }
};


export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "Missing required field",
    });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      res.status(400).json({
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
    return;
  } catch (error) {
    console.error("Error logging user", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    return;
  }
};

export const logout = async (_: Request, res: Response): Promise<void> => {
    res.cookie('jwt', '', { maxAge: 0 });

    res.status(200).json({
        success: true,
        message: 'Logout successfully'
    });
};

export const updateProfile = async (
  req: Request<{}, {}, UpdateProfileBody>,
  res: Response
): Promise<void> => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      res.status(400).json({
        success: false,
        message: "Missing required field",
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePicture);

    if (!uploadResponse) {
      res.status(400).json({
        success: false,
        message: "Upload error",
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
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
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};