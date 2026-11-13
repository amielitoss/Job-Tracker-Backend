import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import type { DatabaseError } from "pg";
import jwt from "jsonwebtoken";

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

const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if(!email || !password){
      return res.status(400).json({
        status: "FAILED",
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try{
      const result = await pool.query("SELECT user_uid, email, password_hash FROM users WHERE email = $1", [normalizedEmail]);
      
      if(result.rows.length === 0){
        return res.status(401).json({
          status: "FAILED",
          message: "Invalid email or password",
        });
      }
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if(!isPasswordValid){
        return res.status(401).json({
          status: "FAILED",
          message: "Invalid email or password",
        })
      }

      const token = jwt.sign(
        { userId: user.user_uid },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h"}
      );

      res.cookie("token", token, {
        httpOnly:  true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      });

      return res.status(200).json({
        user_uid: user.user_uid,
        email: user.email,
      })

    } catch(error){
      console.error(error);
      return res.status(500).json({
        status: "FAILED",
        message: "Unable to login",
      });
    }
};

export { registerUser, loginUser };
