import express from "express";
import {
  isAuthenticated,
  login,
  logout,
  signup,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  loginSchema,
  signupSchema,
  updateProfileSchema,
} from "../schemas/auth.schema.js";

const router = express.Router();

router.post("/signup", arcjetProtection, validate(signupSchema), signup);
router.post("/login", arcjetProtection, validate(loginSchema), login);
router.post("/logout", logout);

router.put(
  "/update-profile",
  arcjetProtection,
  protectRoute,
  validate(updateProfileSchema),
  updateProfile
);
router.get("/check", arcjetProtection, protectRoute, isAuthenticated);

export default router;
