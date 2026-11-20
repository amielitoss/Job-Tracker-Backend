import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import type { DatabaseError } from "pg";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { randomInt } from "node:crypto";
import { sendVerificationEmail } from "../services/mailService.js";

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// REGISTER A USER
const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "FAILED",
      message: "Email and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please provide a valid email",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: "FAILED",
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationCode = randomInt(100000, 1000000).toString();
    const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
    const verificationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, verification_code, verification_code_expires_at) VALUES ($1, $2, $3, $4) RETURNING user_uid, email, created_at",
      [
        normalizedEmail,
        passwordHash,
        verificationCodeHash,
        verificationCodeExpiresAt,
      ],
    );
    await sendVerificationEmail(normalizedEmail, verificationCode);

    return res.status(201).json({
      status: "OK",
      message: "Registration successful",
      user: result.rows[0],
    });
  } catch (error) {
    const dbError = error as DatabaseError;
    if (dbError.code === "23505") {
      return res.status(409).json({
        status: "FAILED",
        message: "Email already registered",
      });
    }
    console.error(error);
    return res.status(500).json({
      status: "FAILED",
      message: "Unable to register user",
    });
  }
};
// REGISTER A USER

// VERIFY EMAIL
const verifyEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      status: "FAILED",
      message: "Email and verification code are required",
    });
  }
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const result = await pool.query(
      "SELECT user_uid, email, verification_code, verification_code_expires_at, is_verified FROM users WHERE email = $1",
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found",
      });
    }

    const user = result.rows[0];

    if (user.is_verified) {
      return res.status(400).json({
        status: "FAILED",
        message: "Email is already verified",
      });
    }

    const verificationCodeExpiresAt = new Date(
      user.verification_code_expires_at,
    );

    if (
      !user.verification_code_expires_at ||
      verificationCodeExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "Verification code has expired",
      });
    }

    const isCodeValid = await bcrypt.compare(code, user.verification_code);

    if (!isCodeValid) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid verification code",
      });
    }

    await pool.query(
      `UPDATE users SET is_verified = TRUE,
    verification_code = NULL,
    verification_code_expires_at = NULL
    WHERE user_uid = $1`,
      [user.user_uid],
    );

    return res.status(200).json({
      status: "OK",
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "FAILED",
      message: "Unable to verify email",
    });
  }
};
// VERIFY EMAIL

// LOGIN A USER
const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "FAILED",
      message: "Email and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      "SELECT user_uid, email, password_hash, is_verified FROM users WHERE email = $1",
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "FAILED",
        message: "Invalid email or password",
      });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "FAILED",
        message: "Invalid email or password",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        status: "FAILED",
        message: "Please verify your email before logging in",
      });
    }

    const token = jwt.sign(
      { userId: user.user_uid },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: "OK",
      message: "Login successful",
      user: {
        user_uid: user.user_uid,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "FAILED",
      message: "Unable to login",
    });
  }
};
// LOGIN A USER

// LOGOUT A USER
const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    status: "OK",
    message: "Logged out successfully",
  });
};
// LOGOUT A USER

// GET THE CURRENT USER or (/me)
const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      "SELECT user_uid, email, created_at FROM users WHERE user_uid = $1",
      [userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "OK",
      message: "Current user fetched successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "FAILED",
      message: "Unable to fetch current user",
    });
  }
};
// GET THE CURRENT USER or (/me)

export { registerUser, verifyEmail, loginUser, logoutUser, getCurrentUser };
