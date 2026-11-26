import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerificationCode,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    status: "FAILED",
    message: "Too many requests. Please try again later.",
  },
});

router.get("/me", authenticateUser, getCurrentUser);
router.post("/register", authLimiter, registerUser);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, resendVerificationCode);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/login", authLimiter, loginUser);
router.post("/logout", logoutUser);

export default router;
