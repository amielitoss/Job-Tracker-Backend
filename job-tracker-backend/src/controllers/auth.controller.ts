import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import type { DatabaseError } from "pg";

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

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
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING user_uid, email, created_at",
      [normalizedEmail, passwordHash],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    const dbError = error as DatabaseError;
    console.error(error);
    if(dbError.code === "23505"){
        return res.status(409).json({
            status: "FAILED",
            message: "Email already registered"
        })
    }
    return res.status(500).json({
      status: "FAILED",
      message: "Unable to register user",
    });
  }
};

export { registerUser };
