import { Router, Response } from "express";
import { db } from "../config/database.js";
import {
  AuthenticatedRequest,
  requireAuth,
} from "../middleware/auth.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| GET CURRENT RIDEX ACCOUNT
|--------------------------------------------------------------------------
|
| RIDEX supports ONE Firebase identity with multiple capabilities.
|
| profiles
|    |
|    +-- Passenger capability
|    |
|    +-- rider_profiles
|           |
|           +-- Rider capability
|
| IMPORTANT:
| - profiles.role is NOT used as the rider capability flag.
| - rider_profiles existence determines whether rider capability exists.
| - verification_status determines the rider lifecycle.
| - The same Firebase account can remain a passenger AND become a rider.
|
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const firebaseUid = req.user?.uid;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error: "Authenticated Firebase user ID not found",
        });
      }

      const result = await db.query(
        `
        SELECT
          p.id,
          p.firebase_uid,
          p.full_name,
          p.avatar_url,
          p.role,
          p.is_active,
          p.created_at,
          p.updated_at,

          CASE
            WHEN rp.id IS NOT NULL THEN TRUE
            ELSE FALSE
          END AS has_rider_capability,

          rp.verification_status,
          rp.is_online

        FROM public.profiles p

        LEFT JOIN public.rider_profiles rp
          ON rp.id = p.id

        WHERE p.firebase_uid = $1
        LIMIT 1;
        `,
        [firebaseUid]
      );

      /*
       * Firebase account exists, but RIDEX account does not.
       */
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "RIDEX account not found",
          accountStatus: "not_registered",
        });
      }

      const account = result.rows[0];

      /*
       * Base RIDEX profile exists.
       *
       * Passenger capability remains available through profiles.
       *
       * Rider capability is determined independently by rider_profiles.
       */
      if (account.has_rider_capability) {
        const appResult = await db.query(
          `
          SELECT status
          FROM public.rider_applications
          WHERE rider_id = $1
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [account.id]
        );

        const appStatus = appResult.rows.length > 0 ? appResult.rows[0].status : null;
        let mappedRiderStatus = 'onboarding';

        if (!appStatus || appStatus === 'draft') {
          mappedRiderStatus = 'onboarding';
        } else if (appStatus === 'submitted' || appStatus === 'under_review') {
          mappedRiderStatus = 'pending';
        } else if (appStatus === 'correction_required') {
          mappedRiderStatus = 'correction_required';
        } else if (appStatus === 'approved') {
          mappedRiderStatus = 'approved';
        } else if (appStatus === 'rejected') {
          mappedRiderStatus = 'rejected';
        }

        return res.json({
          success: true,
          user: account,
          accountStatus: "registered",
          capabilities: {
            passenger: true,
            rider: true,
          },
          riderStatus: mappedRiderStatus,
          riderApplicationStatus: appStatus,
        });
      }

      /*
       * Existing account without rider capability.
       *
       * This is normally an existing passenger who has not yet
       * completed rider registration.
       */
      return res.json({
        success: true,
        user: account,
        accountStatus: "registered",
        capabilities: {
          passenger: true,
          rider: false,
        },
        riderStatus: "not_registered",
      });
    } catch (error) {
      console.error("GET /api/auth/me error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to load RIDEX account",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| REGISTER RIDER CAPABILITY
|--------------------------------------------------------------------------
|
| This endpoint NEVER creates another Firebase identity.
|
| Existing passenger:
|
| profiles
|    role = passenger
|         +
| rider_profiles
|
| Existing rider:
|    returns current rider state
|
| New Firebase user:
|    creates profiles + rider_profiles
|
| SECURITY:
| - Firebase ID token required.
| - Firebase UID comes from verified token.
| - Client cannot choose rider status.
| - Client cannot approve itself.
| - Client cannot activate itself.
|
|--------------------------------------------------------------------------
*/

router.post(
  "/rider/register",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await db.connect();

    try {
      const firebaseUid = req.user?.uid;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error: "Authenticated Firebase user ID not found",
        });
      }

      await client.query("BEGIN");

      /*
       * Find the existing RIDEX profile for this Firebase identity.
       */
      const existingResult = await client.query(
        `
        SELECT
          p.id,
          p.firebase_uid,
          p.full_name,
          p.avatar_url,
          p.role,
          p.is_active,
          p.created_at,
          p.updated_at,

          rp.id AS rider_profile_id,
          rp.verification_status,
          rp.is_online

        FROM public.profiles p

        LEFT JOIN public.rider_profiles rp
          ON rp.id = p.id

        WHERE p.firebase_uid = $1
        LIMIT 1

        FOR UPDATE OF p;
        `,
        [firebaseUid]
      );

      /*
       * ---------------------------------------------------------------
       * EXISTING RIDEX ACCOUNT
       * ---------------------------------------------------------------
       */
      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];

        /*
         * Rider capability already exists.
         */
        if (existing.rider_profile_id) {
          const appResult = await client.query(
            `
            SELECT status
            FROM public.rider_applications
            WHERE rider_id = $1
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [existing.id]
          );

          let appStatus = appResult.rows.length > 0 ? appResult.rows[0].status : null;

          if (!appStatus) {
            await client.query(
              `
              INSERT INTO public.rider_applications (rider_id, status)
              VALUES ($1, 'draft')
              `,
              [existing.id]
            );
            appStatus = 'draft';
          }

          await client.query("COMMIT");

          let mappedRiderStatus = 'onboarding';

          if (!appStatus || appStatus === 'draft') {
            mappedRiderStatus = 'onboarding';
          } else if (appStatus === 'submitted' || appStatus === 'under_review') {
            mappedRiderStatus = 'pending';
          } else if (appStatus === 'correction_required') {
            mappedRiderStatus = 'correction_required';
          } else if (appStatus === 'approved') {
            mappedRiderStatus = 'approved';
          } else if (appStatus === 'rejected') {
            mappedRiderStatus = 'rejected';
          }

          return res.json({
            success: true,
            created: false,
            message: "RIDEX rider capability already exists.",
            user: {
              id: existing.id,
              firebase_uid: existing.firebase_uid,
              full_name: existing.full_name,
              avatar_url: existing.avatar_url,
              role: existing.role,
              is_active: existing.is_active,
              created_at: existing.created_at,
              updated_at: existing.updated_at,
              rider_profile_id: existing.rider_profile_id,
              verification_status: existing.verification_status,
              is_online: existing.is_online,
            },
            accountStatus: "registered",
            capabilities: {
              passenger: true,
              rider: true,
            },
            riderStatus: mappedRiderStatus,
            riderApplicationStatus: appStatus,
          });
        }

        /*
         * -------------------------------------------------------------
         * EXISTING PASSENGER -> ADD RIDER CAPABILITY
         * -------------------------------------------------------------
         *
         * IMPORTANT:
         *
         * We DO NOT change:
         *
         *     profiles.role
         *
         * The existing profile remains untouched.
         *
         * We simply add rider_profiles using the same profile ID.
         */
        const riderResult = await client.query(
          `
          INSERT INTO public.rider_profiles (
            id,
            verification_status,
            is_online
          )
          VALUES (
            $1,
            'pending',
            FALSE
          )
          RETURNING
            id,
            verification_status,
            is_online,
            created_at,
            updated_at;
          `,
          [existing.id]
        );

        await client.query(
          `
          INSERT INTO public.rider_applications (rider_id, status)
          VALUES ($1, 'draft')
          `,
          [existing.id]
        );

        await client.query("COMMIT");

        return res.status(201).json({
          success: true,
          created: true,
          message:
            "RIDEX rider capability created for the existing account.",
          user: {
            id: existing.id,
            firebase_uid: existing.firebase_uid,
            full_name: existing.full_name,
            avatar_url: existing.avatar_url,
            role: existing.role,
            is_active: existing.is_active,
            created_at: existing.created_at,
            updated_at: existing.updated_at,
            ...riderResult.rows[0],
          },
          accountStatus: "registered",
          capabilities: {
            passenger: true,
            rider: true,
          },
          riderStatus: "onboarding",
          riderApplicationStatus: "draft",
        });
      }

      /*
       * ---------------------------------------------------------------
       * NEW RIDEX ACCOUNT
       * ---------------------------------------------------------------
       *
       * No RIDEX profile exists for this Firebase identity.
       *
       * Create the base profile first, then rider capability.
       */
      const profileResult = await client.query(
        `
        INSERT INTO public.profiles (
          firebase_uid,
          role,
          is_active
        )
        VALUES (
          $1,
          'rider',
          TRUE
        )
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
        [firebaseUid]
      );

      const profile = profileResult.rows[0];

      /*
       * New rider capability always starts pending.
       */
      const riderResult = await client.query(
        `
        INSERT INTO public.rider_profiles (
          id,
          verification_status,
          is_online
        )
        VALUES (
          $1,
          'pending',
          FALSE
        )
        RETURNING
          id,
          verification_status,
          is_online,
          created_at,
          updated_at;
        `,
        [profile.id]
      );

      await client.query(
        `
        INSERT INTO public.rider_applications (rider_id, status)
        VALUES ($1, 'draft')
        `,
        [profile.id]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        created: true,
        message: "RIDEX account and rider capability created.",
        user: {
          ...profile,
          ...riderResult.rows[0],
        },
        accountStatus: "registered",
        capabilities: {
          passenger: true,
          rider: true,
        },
        riderStatus: "onboarding",
        riderApplicationStatus: "draft",
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Ignore rollback errors.
      }

      console.error("POST /api/auth/rider/register error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to register RIDEX rider capability",
      });
    } finally {
      client.release();
    }
  }
);

export default router;