import express from "express";
import {isAuthenticated, login, logout, signup, updateProfile} from "../controllers/auth.controller.js";
import {protectRoute} from "../middleware/auth.middleware.js";
import {arcjetProtection} from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.post('/signup', arcjetProtection, signup);
router.post('/login', arcjetProtection, login)
router.post('/logout', arcjetProtection, logout)

router.put('/update-profile', protectRoute, arcjetProtection, updateProfile)
router.get('/check', protectRoute, arcjetProtection, isAuthenticated)

export default router;