import type { Request } from "express";

export type AuthenticatedRequest<P = {}> = Request<P> & {
  userId?: string;
};