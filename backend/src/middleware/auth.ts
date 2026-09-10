import { NextFunction, Request, Response } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { firebaseAdminAuth } from "../config/firebase-admin.js";

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        error: "Missing Authorization header",
      });
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        error: "Invalid Authorization header",
      });
    }

    const decodedToken = await firebaseAdminAuth.verifyIdToken(token);

    req.user = decodedToken;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      success: false,
      error: "Invalid or expired authentication token",
    });
  }
}

/*
|--------------------------------------------------------------------------
| REQUIRE ADMIN
|--------------------------------------------------------------------------
|
| Admin access is controlled by a Firebase custom claim:
|
| {
|   admin: true
| }
|
| This check MUST happen on the backend.
| Never trust the Admin Panel frontend to decide who is an admin.
|
|--------------------------------------------------------------------------
*/

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    /*
     * requireAuth should normally run before requireAdmin.
     */
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (req.user.admin !== true) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(403).json({
      success: false,
      error: "Admin access required",
    });
  }
}