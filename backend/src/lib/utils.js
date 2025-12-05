import jwt from 'jsonwebtoken';
import {ENV} from "./env.js";

export const generateToken = (userId, res) => {
    const { JWT_SECRET } = ENV;
    if (!JWT_SECRET) {
        throw new Error('JWT secret must be a string');
    }

    const token = jwt.sign({userId}, JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, // Prevent XSS attacks: Cross-Site Scripting
        sameSite: "strict", // CSRF attacks
        secure: ENV.NODE_ENV === "production"
    })

    return token;
}