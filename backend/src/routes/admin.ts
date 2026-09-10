import { Router, Response } from "express";
import {
  AuthenticatedRequest,
  requireAuth,
  requireAdmin,
} from "../middleware/auth.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| ADMIN HEALTH / IDENTITY CHECK
|--------------------------------------------------------------------------
|
| GET /api/admin/me
|
| Used by the Admin Panel to confirm that the authenticated
| Firebase account actually has admin privileges.
|
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      return res.json({
        success: true,
        admin: true,
        user: {
          uid: user.uid,
          email: user.email ?? null,
          phoneNumber: user.phone_number ?? null,
          name: user.name ?? null,
          picture: user.picture ?? null,
        },
      });
    } catch (error) {
      console.error("GET /api/admin/me error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to load admin account",
      });
    }
  }
);

export default router;