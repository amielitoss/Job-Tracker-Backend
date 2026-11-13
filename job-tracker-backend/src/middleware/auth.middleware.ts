import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import jwt from "jsonwebtoken";

type AuthTokenPayload = {
    userId: string;
};

const authenticateUser = (req: AuthenticatedRequest, res: Response,
next: NextFunction,
) => {
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({
            status: "FAILED",
            message: "Authentication required",
        });
    }

    try{
       const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET as string
    ) as AuthTokenPayload;

    req.userId = decoded.userId;
    next()
    } catch(error){
        return res.status(401).json({
            status: "FAILED",
            message: "Invalid or expired token"
        })
    }
};

export { authenticateUser };