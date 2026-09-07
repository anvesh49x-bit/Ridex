import { Router, Response } from "express";
import { db } from "../config/database.js";
import {
  AuthenticatedRequest,
  requireAuth,
} from "../middleware/auth.js";

const router = Router();

const VALID_VEHICLE_TYPES = [
  "bike",
  "scooter",
  "auto",
  "car",
];

const VALID_PAYMENT_METHODS = [
  "cash",
  "upi",
];

router.post(
  "/",
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

      const {
        pickup,
        drop,
        vehicleType,
        passengerOffer,
        paymentMethod,
        note,
      } = req.body;

      // Validate pickup
      if (
        !pickup ||
        typeof pickup.lat !== "number" ||
        typeof pickup.lng !== "number"
      ) {
        return res.status(400).json({
          success: false,
          error: "Valid pickup coordinates are required",
        });
      }

      // Validate destination
      if (
        !drop ||
        typeof drop.lat !== "number" ||
        typeof drop.lng !== "number"
      ) {
        return res.status(400).json({
          success: false,
          error: "Valid destination coordinates are required",
        });
      }

      // Validate vehicle
      if (!VALID_VEHICLE_TYPES.includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          error: "Invalid vehicle type",
        });
      }

      // Validate passenger offer
      if (
        typeof passengerOffer !== "number" ||
        !Number.isFinite(passengerOffer) ||
        passengerOffer <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Passenger offer must be a positive number",
        });
      }

      // Validate payment
      if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          error: "Invalid payment method",
        });
      }

      // Validate coordinates
      if (
        pickup.lat < -90 ||
        pickup.lat > 90 ||
        pickup.lng < -180 ||
        pickup.lng > 180 ||
        drop.lat < -90 ||
        drop.lat > 90 ||
        drop.lng < -180 ||
        drop.lng > 180
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid coordinates",
        });
      }

      await client.query("BEGIN");

      // --------------------------------------------------
      // Find RIDEX profile using Firebase UID
      // --------------------------------------------------

      const profileResult = await client.query(
        `
        SELECT
          id,
          role,
          is_active
        FROM public.profiles
        WHERE firebase_uid = $1
        LIMIT 1
        `,
        [firebaseUid]
      );

      if (profileResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
          message:
            "Call GET /api/auth/me first to create the RIDEX profile.",
        });
      }

      const profile = profileResult.rows[0];

      if (!profile.is_active) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "RIDEX account is inactive",
        });
      }

      if (profile.role !== "passenger") {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "Only passenger accounts can create rides",
        });
      }

      const passengerId = profile.id;

      // --------------------------------------------------
      // Create ride request
      // --------------------------------------------------

      const rideResult = await client.query(
        `
        INSERT INTO public.ride_requests (
          passenger_id,
          pickup_location,
          drop_location,
          pickup_name,
          drop_name,
          pickup_address,
          drop_address,
          vehicle_type,
          passenger_offer,
          payment_method,
          note,
          status
        )
        VALUES (
          $1,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
          ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          'searching'
        )
        RETURNING
          id,
          passenger_id,
          pickup_name,
          drop_name,
          vehicle_type,
          passenger_offer,
          payment_method,
          note,
          status,
          requested_at,
          created_at,
          updated_at
        `,
        [
          passengerId,
          pickup.lng,
          pickup.lat,
          drop.lng,
          drop.lat,
          pickup.name ?? null,
          drop.name ?? null,
          pickup.address ?? null,
          drop.address ?? null,
          vehicleType,
          passengerOffer,
          paymentMethod,
          note ?? null,
        ]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        ride: rideResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Create ride request error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to create ride request",
      });
    } finally {
      client.release();
    }
  }
);

export default router;