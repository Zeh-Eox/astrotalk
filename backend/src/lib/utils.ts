import jwt from "jsonwebtoken";
import { Response } from "express";
import { Types } from "mongoose";
import { ENV } from "./env.js";

export const generateToken = (userId: Types.ObjectId, res: Response): string => {
  const token = jwt.sign(
    { userId: userId.toString() },
    ENV.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, // XSS protection: Cross-Site Scripting
    sameSite: "strict", // CSRF protection: Cross-Site Request Forgery
    secure: ENV.NODE_ENV === "production",
  });

  return token;
};