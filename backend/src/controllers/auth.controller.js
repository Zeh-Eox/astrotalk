import bcrypt from "bcryptjs";
import {generateToken} from "../lib/utils.js";
import {sendWelcomeEmail} from "../emails/emailHandlers.js";
import {ENV} from "../lib/env.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

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
                message: 'UserModel already exists'
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
                message: 'UserModel saved successfully',
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
                message: 'Invalid UserModel data'
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
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Missing required field'
        })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Credentials'
            })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Credentials'
            })
        }

        generateToken(user._id, res);

        return res.status(200).json({
            success: true,
            message: 'Login successfully',
            data: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePicture: user.profilePicture
            }
        })
    } catch (e) {
        console.error("Error logging user", e);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
}

export const logout = async (_, res) => {
    res.cookie('jwt', '', {maxAge: 0});
    return res.status(200).json({
        success: true,
        message: 'Logout successfully'
    })
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePicture } = req.body;
        if (!profilePicture) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field'
            })
        }

        const userId = req.user._id;

        const uploadResponse = await cloudinary.uploader.upload(profilePicture);
        if (!uploadResponse) {
            return res.status(400).json({
                success: false,
                message: 'Upload error'
            })
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { profilePicture: uploadResponse.secure_url }, { new: true });

        return res.status(200).json({
            success: true,
            message: 'Updated user',
            data: updatedUser
        })
    } catch (e) {
        console.error("Error updating profile", e);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
}

export const isAuthenticated = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not Authenticated'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Authenticated successfully',
            data: req.user
        })
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
}