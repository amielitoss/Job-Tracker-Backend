import express from "express";
import  { registerUser, loginUser, logoutUser, getCurrentUser, verifyEmail, forgotPassword, resetPassword, resendVerificationCode } from "../controllers/auth.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", authenticateUser, getCurrentUser);
router.post("/register", registerUser)
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationCode);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/login", loginUser)
router.post("/logout", logoutUser)

export default router;