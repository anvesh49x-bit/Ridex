import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../config/database.js";
import {
  AuthenticatedRequest,
  requireAuth,
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const firebaseUid = req.user!.uid;

      let result = await db.query(
        `
        SELECT
          id,
          firebase_uid,
          full_name,
          avatar_url,
          role,
          is_active,
          created_at,
          updated_at
        FROM public.profiles
        WHERE firebase_uid = $1
        LIMIT 1;
        `,
        [firebaseUid]
      );

      // Create RIDEX profile for first-time Firebase user
      if (result.rows.length === 0) {
        const profileId = randomUUID();

        const created = await db.query(
          `
          INSERT INTO public.profiles (
            id,
            firebase_uid,
            role
          )
          VALUES ($1, $2, 'passenger')
          ON CONFLICT DO NOTHING
          RETURNING
            id,
            firebase_uid,
            full_name,
            avatar_url,
            role,
            is_active,
            created_at,
            updated_at;
          `,
          [profileId, firebaseUid]
        );

        if (created.rows.length > 0) {
          result = created;
        } else {
          result = await db.query(
            `
            SELECT
              id,
              firebase_uid,
              full_name,
              avatar_url,
              role,
              is_active,
              created_at,
              updated_at
            FROM public.profiles
            WHERE firebase_uid = $1
            LIMIT 1;
            `,
            [firebaseUid]
          );
        }
      }

      if (result.rows.length === 0) {
        return res.status(500).json({
          success: false,
          error: "Unable to create or find RIDEX profile",
        });
      }

      return res.json({
        success: true,
        user: result.rows[0],
      });
    } catch (error) {
      console.error("GET /api/auth/me error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to load user profile",
      });
    }
  }
);

export default router;