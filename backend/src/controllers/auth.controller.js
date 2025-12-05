import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import {generateToken} from "../lib/utils.js";
import {sendWelcomeEmail} from "../emails/emailHandlers.js";
import {ENV} from "../lib/env.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field'
            })
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            })
        }

        const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            })
        }

        const user = await User.findOne({
            email: email
        })

        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        })

        if (newUser) {
            const savedUser = await newUser.save();
            generateToken(savedUser._id, res)

            try {
                await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL)
            } catch (e) {
                console.error("Failed to send email email", e)
            }

            return res.status(201).json({
                success: true,
                message: 'User saved successfully',
                data: {
                    id: newUser._id,
                    email: newUser.email,
                    fullName: newUser.fullName,
                    profilePicture: newUser.profilePicture,
                }
            })
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid User data'
            })
        }
    } catch (e) {
        console.error("Error creating user", e);

        if (e?.code === 11000 && (e.keyPattern?.email || e.keyValue?.email)){
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            })
        }

        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
}

export const login = async (req, res) => {

}

export const logout = async (req, res) => {

}