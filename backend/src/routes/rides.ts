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

const ACTIVE_RIDE_STATUSES = [
  "searching",
  "negotiating",
  "matched",
  "driver_arriving",
  "driver_arrived",
  "in_progress",
];

const MATCHABLE_RIDE_STATUSES = [
  "searching",
  "negotiating",
];

function isValidCoordinate(
  lat: unknown,
  lng: unknown
): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

async function getProfileByFirebaseUid(
  firebaseUid: string
) {
  const result = await db.query(
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

  return result.rows[0] ?? null;
}

/*
|--------------------------------------------------------------------------
| CREATE RIDE
|--------------------------------------------------------------------------
*/

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

      if (
        !pickup ||
        !isValidCoordinate(pickup.lat, pickup.lng)
      ) {
        return res.status(400).json({
          success: false,
          error: "Valid pickup coordinates are required",
        });
      }

      if (
        !drop ||
        !isValidCoordinate(drop.lat, drop.lng)
      ) {
        return res.status(400).json({
          success: false,
          error: "Valid destination coordinates are required",
        });
      }

      if (!VALID_VEHICLE_TYPES.includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          error: "Invalid vehicle type",
        });
      }

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

      if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          error: "Invalid payment method",
        });
      }

      await client.query("BEGIN");

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
          ST_SetSRID(
            ST_MakePoint($2, $3),
            4326
          )::geography,
          ST_SetSRID(
            ST_MakePoint($4, $5),
            4326
          )::geography,
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
          profile.id,
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

/*
|--------------------------------------------------------------------------
| RIDER ONLINE / OFFLINE STATUS
|--------------------------------------------------------------------------
*/

router.post(
  "/rider/status",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const firebaseUid = req.user?.uid;
      const { isOnline } = req.body;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error: "Authenticated Firebase user ID not found",
        });
      }

      if (typeof isOnline !== "boolean") {
        return res.status(400).json({
          success: false,
          error: "isOnline must be a boolean",
        });
      }

      const profile = await getProfileByFirebaseUid(firebaseUid);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
        });
      }

      if (profile.role !== "rider") {
        return res.status(403).json({
          success: false,
          error: "Only riders can change rider status",
        });
      }

      if (!profile.is_active) {
        return res.status(403).json({
          success: false,
          error: "RIDEX account is inactive",
        });
      }

      const riderResult = await db.query(
        `
        UPDATE public.rider_profiles
        SET
          is_online = $1,
          updated_at = NOW()
        WHERE id = $2
          AND verification_status = 'approved'
        RETURNING
          id,
          is_online,
          verification_status,
          last_location,
          last_location_at
        `,
        [isOnline, profile.id]
      );

      if (riderResult.rowCount === 0) {
        return res.status(403).json({
          success: false,
          error:
            "Rider is not approved or rider profile was not found",
        });
      }

      return res.json({
        success: true,
        rider: riderResult.rows[0],
      });
    } catch (error) {
      console.error("Rider status error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to update rider status",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| RIDER LOCATION
|--------------------------------------------------------------------------
*/

router.post(
  "/rider/location",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const firebaseUid = req.user?.uid;
      const { lat, lng } = req.body;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error: "Authenticated Firebase user ID not found",
        });
      }

      if (!isValidCoordinate(lat, lng)) {
        return res.status(400).json({
          success: false,
          error:
            "Valid latitude and longitude are required",
        });
      }

      const profile = await getProfileByFirebaseUid(firebaseUid);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
        });
      }

      if (profile.role !== "rider") {
        return res.status(403).json({
          success: false,
          error: "Only riders can update rider location",
        });
      }

      const result = await db.query(
        `
        UPDATE public.rider_profiles
        SET
          last_location = ST_SetSRID(
            ST_MakePoint($1, $2),
            4326
          )::geography,
          last_location_at = NOW()
        WHERE id = $3
          AND is_online = TRUE
          AND verification_status = 'approved'
        RETURNING
          id,
          ST_Y(last_location::geometry) AS lat,
          ST_X(last_location::geometry) AS lng,
          last_location_at
        `,
        [lng, lat, profile.id]
      );

      if (result.rowCount === 0) {
        return res.status(409).json({
          success: false,
          error: "Rider must be approved and online",
        });
      }

      return res.json({
        success: true,
        location: result.rows[0],
      });
    } catch (error) {
      console.error("Rider location error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to update rider location",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| RIDER AVAILABLE RIDES
|--------------------------------------------------------------------------
|
| Returns two queues:
|
| newRides:
|   Rides this rider has never rejected.
|
| earlierRides:
|   Rides this rider rejected previously but which are
|   still active and unmatched.
|
| IMPORTANT:
| Rejection does NOT reserve a ride.
|
| If Rider A rejects Ride #101 and Rider B accepts it,
| Ride #101 becomes matched and disappears from BOTH
| queues for Rider A.
|--------------------------------------------------------------------------
*/

router.get(
  "/rider/rides/available",
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

      const profile = await getProfileByFirebaseUid(firebaseUid);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
        });
      }

      if (profile.role !== "rider") {
        return res.status(403).json({
          success: false,
          error: "Only riders can view available rides",
        });
      }

      const riderResult = await db.query(
        `
        SELECT
          rp.id,
          rp.is_online,
          rp.verification_status,
          rp.last_location,
          rp.service_radius_m
        FROM public.rider_profiles rp
        WHERE rp.id = $1
        LIMIT 1
        `,
        [profile.id]
      );

      if (riderResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Rider profile not found",
        });
      }

      const rider = riderResult.rows[0];

      if (rider.verification_status !== "approved") {
        return res.status(403).json({
          success: false,
          error: "Rider is not approved",
        });
      }

      if (!rider.is_online) {
        return res.json({
          success: true,
          newRides: [],
          earlierRides: [],
          rides: [],
          counts: {
            new: 0,
            earlier: 0,
            total: 0,
          },
        });
      }

      if (!rider.last_location) {
        return res.status(409).json({
          success: false,
          error:
            "Rider location is required before finding rides",
        });
      }

      const result = await db.query(
        `
        SELECT
          r.id,
          r.passenger_id,

          r.pickup_name,
          r.pickup_address,

          r.drop_name,
          r.drop_address,

          ST_Y(
            r.pickup_location::geometry
          ) AS pickup_lat,

          ST_X(
            r.pickup_location::geometry
          ) AS pickup_lng,

          ST_Y(
            r.drop_location::geometry
          ) AS drop_lat,

          ST_X(
            r.drop_location::geometry
          ) AS drop_lng,

          r.vehicle_type,
          r.passenger_offer,
          r.agreed_fare,
          r.payment_method,
          r.status,
          r.requested_at,

          ST_Distance(
            rp.last_location,
            r.pickup_location
          ) AS pickup_distance_meters,

          CASE
            WHEN rr.id IS NULL THEN FALSE
            ELSE TRUE
          END AS is_rejected,

          rr.rejected_at

        FROM public.ride_requests r

        CROSS JOIN public.rider_profiles rp

        LEFT JOIN public.rider_ride_rejections rr
          ON rr.ride_request_id = r.id
          AND rr.rider_id = rp.id

        WHERE
          rp.id = $1

          AND r.status IN (
            'searching',
            'negotiating'
          )

          AND r.assigned_rider_id IS NULL

          AND r.vehicle_type IN (
            SELECT v.vehicle_type
            FROM public.vehicles v
            WHERE v.rider_id = rp.id
              AND v.is_active = TRUE
          )

          AND ST_DWithin(
            rp.last_location,
            r.pickup_location,
            rp.service_radius_m
          )

        ORDER BY
          pickup_distance_meters ASC,
          r.requested_at ASC

        LIMIT 100
        `,
        [profile.id]
      );

      const newRides = result.rows.filter(
        (ride) => !ride.is_rejected
      );

      const earlierRides = result.rows.filter(
        (ride) => ride.is_rejected
      );

      return res.json({
        success: true,

        /*
         * New marketplace queue.
         */
        newRides,

        /*
         * Previously rejected but still available.
         */
        earlierRides,

        /*
         * Kept for compatibility with clients that
         * currently expect a "rides" property.
         *
         * This contains all currently available rides.
         */
        rides: result.rows,

        counts: {
          new: newRides.length,
          earlier: earlierRides.length,
          total: result.rows.length,
        },
      });
    } catch (error) {
      console.error(
        "Available rider rides error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Failed to get available rides",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| RIDER REJECT RIDE
|--------------------------------------------------------------------------
|
| Rejecting a ride only records the rider's decision.
|
| It does NOT:
| - cancel the ride
| - reserve the ride
| - prevent another rider from accepting it
| - change the ride status
|
| The ride remains available to this rider in EARLIER
| until another rider matches it or the ride becomes
| otherwise unavailable.
|--------------------------------------------------------------------------
*/

router.post(
  "/rider/rides/:rideId/reject",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await db.connect();

    try {
      const firebaseUid = req.user?.uid;
      const { rideId } = req.params;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error:
            "Authenticated Firebase user ID not found",
        });
      }

      const profile = await getProfileByFirebaseUid(
        firebaseUid
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
        });
      }

      if (profile.role !== "rider") {
        return res.status(403).json({
          success: false,
          error: "Only riders can reject rides",
        });
      }

      if (!profile.is_active) {
        return res.status(403).json({
          success: false,
          error: "RIDEX account is inactive",
        });
      }

      await client.query("BEGIN");

      /*
       * Lock the ride while checking its state.
       *
       * This prevents rejection from racing incorrectly
       * with matching operations.
       */
      const rideResult = await client.query(
        `
        SELECT
          id,
          status,
          assigned_rider_id
        FROM public.ride_requests
        WHERE id = $1
        FOR UPDATE
        `,
        [rideId]
      );

      if (rideResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          error: "Ride not found",
        });
      }

      const ride = rideResult.rows[0];

      /*
       * A ride can only be rejected while it is still
       * available for matching.
       */
      if (
        !MATCHABLE_RIDE_STATUSES.includes(
          ride.status
        )
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Ride is no longer available",
          rideStatus: ride.status,
        });
      }

      /*
       * Extra protection.
       *
       * If another rider has already matched this ride,
       * this rider cannot reject/modify it anymore.
       */
      if (ride.assigned_rider_id) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Ride has already been matched",
        });
      }

      /*
       * Make sure the rider profile still exists and is
       * an approved active rider.
       */
      const riderResult = await client.query(
        `
        SELECT
          rp.id,
          rp.verification_status,
          rp.is_online,
          p.is_active
        FROM public.rider_profiles rp
        JOIN public.profiles p
          ON p.id = rp.id
        WHERE rp.id = $1
        FOR UPDATE
        `,
        [profile.id]
      );

      if (riderResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "Rider profile not found",
        });
      }

      const rider = riderResult.rows[0];

      if (!rider.is_active) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "RIDEX account is inactive",
        });
      }

      if (rider.verification_status !== "approved") {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "Rider is not approved",
        });
      }

      /*
       * Record the rejection.
       *
       * ON CONFLICT means:
       * - first rejection creates the row
       * - rejecting the same ride again updates the timestamp
       *
       * This is safe because migration 008 created a
       * unique constraint/index for ride + rider.
       */
      const rejectionResult = await client.query(
        `
        INSERT INTO public.rider_ride_rejections (
          ride_request_id,
          rider_id,
          rejected_at
        )
        VALUES (
          $1,
          $2,
          NOW()
        )
        ON CONFLICT (
          ride_request_id,
          rider_id
        )
        DO UPDATE SET
          rejected_at = NOW()
        RETURNING
          id,
          ride_request_id,
          rider_id,
          rejected_at
        `,
        [rideId, profile.id]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Ride rejected",
        rejection: rejectionResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Rider reject ride error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Failed to reject ride",
      });
    } finally {
      client.release();
    }
  }
);

/*
|--------------------------------------------------------------------------
| RIDER ACCEPT RIDE
|--------------------------------------------------------------------------
|
| Critical race-condition protection:
|
| Rider A -> ACCEPT
| Rider B -> ACCEPT
|
| The ride row is locked with FOR UPDATE.
|
| Only one transaction can successfully match the ride.
|--------------------------------------------------------------------------
*/

router.post(
  "/rider/rides/:rideId/accept",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await db.connect();

    try {
      const firebaseUid = req.user?.uid;
      const { rideId } = req.params;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error:
            "Authenticated Firebase user ID not found",
        });
      }

      const profile = await getProfileByFirebaseUid(
        firebaseUid
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
        });
      }

      if (profile.role !== "rider") {
        return res.status(403).json({
          success: false,
          error: "Only riders can accept rides",
        });
      }

      await client.query("BEGIN");

      /*
       * Lock the ride.
       *
       * This guarantees that if two riders try to
       * accept at almost exactly the same time,
       * only one can win.
       */
      const rideResult = await client.query(
        `
        SELECT
          id,
          passenger_id,
          vehicle_type,
          passenger_offer,
          status,
          assigned_rider_id
        FROM public.ride_requests
        WHERE id = $1
        FOR UPDATE
        `,
        [rideId]
      );

      if (rideResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          error: "Ride not found",
        });
      }

      const ride = rideResult.rows[0];

      if (
        !MATCHABLE_RIDE_STATUSES.includes(
          ride.status
        )
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Ride is no longer available",
          rideStatus: ride.status,
        });
      }

      if (ride.assigned_rider_id) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Ride has already been matched",
        });
      }

      /*
       * Verify rider.
       */
      const riderResult = await client.query(
        `
        SELECT
          rp.id,
          rp.verification_status,
          rp.is_online,
          rp.last_location,
          rp.service_radius_m,
          p.is_active
        FROM public.rider_profiles rp
        JOIN public.profiles p
          ON p.id = rp.id
        WHERE rp.id = $1
        FOR UPDATE
        `,
        [profile.id]
      );

      if (riderResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "Rider profile not found",
        });
      }

      const rider = riderResult.rows[0];

      if (
        !rider.is_active ||
        rider.verification_status !== "approved"
      ) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "Rider is not eligible",
        });
      }

      if (!rider.is_online) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "Rider must be online",
        });
      }

      if (!rider.last_location) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Rider location is required",
        });
      }

      /*
       * Verify matching vehicle.
       */
      const vehicleResult = await client.query(
        `
        SELECT
          id,
          vehicle_type,
          vehicle_number
        FROM public.vehicles
        WHERE rider_id = $1
          AND vehicle_type = $2
          AND is_active = TRUE
        LIMIT 1
        `,
        [profile.id, ride.vehicle_type]
      );

      if (vehicleResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error:
            "No active matching vehicle found",
        });
      }

      /*
       * Verify rider is inside service radius.
       */
      const distanceResult = await client.query(
        `
        SELECT
          ST_Distance(
            $1::geography,
            r.pickup_location
          ) AS distance_meters
        FROM public.ride_requests r
        WHERE r.id = $2
        `,
        [rider.last_location, rideId]
      );

      const distanceMeters = Number(
        distanceResult.rows[0]?.distance_meters
      );

      if (
        !Number.isFinite(distanceMeters) ||
        distanceMeters >
          Number(rider.service_radius_m)
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error:
            "Ride pickup is outside rider service radius",
        });
      }

      /*
       * MATCH.
       */
      const matchedResult = await client.query(
        `
        UPDATE public.ride_requests
        SET
          status = 'matched',
          assigned_rider_id = $1,
          agreed_fare = passenger_offer,
          matched_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
          AND assigned_rider_id IS NULL
        RETURNING
          id,
          passenger_id,
          assigned_rider_id,
          agreed_fare,
          status,
          matched_at
        `,
        [profile.id, rideId]
      );

      if (matchedResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error:
            "Ride was accepted by another rider",
        });
      }

      /*
       * Any existing pending offers are now invalid.
       */
      await client.query(
        `
        UPDATE public.ride_offers
        SET
          status = 'superseded',
          updated_at = NOW()
        WHERE ride_request_id = $1
          AND status = 'pending'
        `,
        [rideId]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Ride accepted successfully",
        ride: matchedResult.rows[0],
        rider: {
          id: profile.id,
          vehicleId:
            vehicleResult.rows[0].id,
          vehicleType:
            vehicleResult.rows[0].vehicle_type,
          vehicleNumber:
            vehicleResult.rows[0].vehicle_number,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Rider accept ride error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Failed to accept ride",
      });
    } finally {
      client.release();
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET RIDE
|--------------------------------------------------------------------------
*/

router.get(
  "/:rideId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const firebaseUid = req.user?.uid;
      const { rideId } = req.params;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error:
            "Authenticated Firebase user ID not found",
        });
      }

      const profile = await getProfileByFirebaseUid(
        firebaseUid
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
        });
      }

      const result = await db.query(
        `
        SELECT
          r.id,
          r.passenger_id,

          r.pickup_name,
          r.pickup_address,

          r.drop_name,
          r.drop_address,

          ST_Y(
            r.pickup_location::geometry
          ) AS pickup_lat,

          ST_X(
            r.pickup_location::geometry
          ) AS pickup_lng,

          ST_Y(
            r.drop_location::geometry
          ) AS drop_lat,

          ST_X(
            r.drop_location::geometry
          ) AS drop_lng,

          r.vehicle_type,
          r.passenger_offer,
          r.agreed_fare,
          r.payment_method,
          r.note,
          r.status,
          r.assigned_rider_id,

          r.requested_at,
          r.matched_at,
          r.started_at,
          r.completed_at,
          r.cancelled_at,
          r.cancellation_reason,

          r.otp_verified_at,
          r.ride_started_at,
          r.ride_completed_at,

          r.created_at,
          r.updated_at

        FROM public.ride_requests r

        WHERE r.id = $1

          AND (
            r.passenger_id = $2
            OR r.assigned_rider_id = $2
          )

        LIMIT 1
        `,
        [rideId, profile.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Ride not found",
        });
      }

      return res.json({
        success: true,
        ride: result.rows[0],
      });
    } catch (error) {
      console.error("Get ride error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to get ride",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET RIDE OFFERS
|--------------------------------------------------------------------------
*/

router.get(
  "/:rideId/offers",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const firebaseUid = req.user?.uid;
      const { rideId } = req.params;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error:
            "Authenticated Firebase user ID not found",
        });
      }

      const profile = await getProfileByFirebaseUid(
        firebaseUid
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
        });
      }

      const rideResult = await db.query(
        `
        SELECT
          id,
          passenger_id,
          status,
          assigned_rider_id
        FROM public.ride_requests
        WHERE id = $1
        LIMIT 1
        `,
        [rideId]
      );

      if (rideResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Ride not found",
        });
      }

      const ride = rideResult.rows[0];

      if (
        profile.role === "passenger" &&
        ride.passenger_id !== profile.id
      ) {
        return res.status(403).json({
          success: false,
          error:
            "You do not have access to this ride",
        });
      }

      if (profile.role === "rider") {
        if (
          ride.assigned_rider_id !== profile.id
        ) {
          const riderOffer = await db.query(
            `
            SELECT id
            FROM public.ride_offers
            WHERE ride_request_id = $1
              AND rider_id = $2
            LIMIT 1
            `,
            [rideId, profile.id]
          );

          if (riderOffer.rowCount === 0) {
            return res.status(403).json({
              success: false,
              error:
                "You do not have access to this ride",
            });
          }
        }
      }

      const offersResult = await db.query(
        `
        SELECT
          o.id,
          o.ride_request_id,
          o.rider_id,
          o.offer_amount,
          o.status,
          o.created_at,
          o.updated_at,
          p.display_name,
          p.phone_number
        FROM public.ride_offers o
        JOIN public.profiles p
          ON p.id = o.rider_id
        WHERE o.ride_request_id = $1
        ORDER BY o.created_at ASC
        `,
        [rideId]
      );

      return res.json({
        success: true,
        offers: offersResult.rows,
      });
    } catch (error) {
      console.error(
        "Get ride offers error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Failed to get ride offers",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| RIDER SEND OFFER / COUNTER OFFER
|--------------------------------------------------------------------------
*/

router.post(
  "/:rideId/offers",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await db.connect();

    try {
      const firebaseUid = req.user?.uid;
      const { rideId } = req.params;
      const { offerAmount } = req.body;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error:
            "Authenticated Firebase user ID not found",
        });
      }

      if (
        typeof offerAmount !== "number" ||
        !Number.isFinite(offerAmount) ||
        offerAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Offer amount must be a positive number",
        });
      }

      await client.query("BEGIN");

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
        });
      }

      const profile = profileResult.rows[0];

      if (profile.role !== "rider") {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error:
            "Only riders can submit ride offers",
        });
      }

      if (!profile.is_active) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "RIDEX account is inactive",
        });
      }

      const riderResult = await client.query(
        `
        SELECT
          id,
          verification_status,
          is_online
        FROM public.rider_profiles
        WHERE id = $1
        LIMIT 1
        `,
        [profile.id]
      );

      if (riderResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "Rider profile not found",
        });
      }

      const rider = riderResult.rows[0];

      if (rider.verification_status !== "approved") {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "Rider is not approved",
        });
      }

      if (!rider.is_online) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error:
            "Rider must be online to send an offer",
        });
      }

      const rideResult = await client.query(
        `
        SELECT
          id,
          passenger_id,
          vehicle_type,
          passenger_offer,
          status,
          assigned_rider_id
        FROM public.ride_requests
        WHERE id = $1
        FOR UPDATE
        `,
        [rideId]
      );

      if (rideResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          error: "Ride not found",
        });
      }

      const ride = rideResult.rows[0];

      if (
        !MATCHABLE_RIDE_STATUSES.includes(
          ride.status
        )
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error:
            "Ride is no longer accepting offers",
          rideStatus: ride.status,
        });
      }

      if (ride.assigned_rider_id) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Ride has already been matched",
        });
      }

      /*
       * Make sure rider has an active vehicle of the
       * requested type.
       */
      const vehicleResult = await client.query(
        `
        SELECT id
        FROM public.vehicles
        WHERE rider_id = $1
          AND vehicle_type = $2
          AND is_active = TRUE
        LIMIT 1
        `,
        [profile.id, ride.vehicle_type]
      );

      if (vehicleResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error:
            "Rider does not have an active vehicle matching this ride",
        });
      }

      /*
       * Only one pending offer per rider per ride.
       */
      const existingOffer = await client.query(
        `
        SELECT
          id,
          status
        FROM public.ride_offers
        WHERE ride_request_id = $1
          AND rider_id = $2
          AND status = 'pending'
        LIMIT 1
        `,
        [rideId, profile.id]
      );

      let offerResult;

      if ((existingOffer.rowCount ?? 0) > 0) {
        offerResult = await client.query(
          `
          UPDATE public.ride_offers
          SET
            offer_amount = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            ride_request_id,
            rider_id,
            offer_amount,
            status,
            created_at,
            updated_at
          `,
          [
            offerAmount,
            existingOffer.rows[0].id,
          ]
        );
      } else {
        offerResult = await client.query(
          `
          INSERT INTO public.ride_offers (
            ride_request_id,
            rider_id,
            offer_amount,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            'pending'
          )
          RETURNING
            id,
            ride_request_id,
            rider_id,
            offer_amount,
            status,
            created_at,
            updated_at
          `,
          [
            rideId,
            profile.id,
            offerAmount,
          ]
        );
      }

      await client.query(
        `
        UPDATE public.ride_requests
        SET
          status = 'negotiating',
          updated_at = NOW()
        WHERE id = $1
          AND status = 'searching'
        `,
        [rideId]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        offer: offerResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Create ride offer error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Failed to create ride offer",
      });
    } finally {
      client.release();
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE / WITHDRAW RIDER OFFER
|--------------------------------------------------------------------------
*/

router.patch(
  "/:rideId/offers/:offerId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await db.connect();

    try {
      const firebaseUid = req.user?.uid;
      const { rideId, offerId } = req.params;
      const { offerAmount, action } = req.body;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error:
            "Authenticated Firebase user ID not found",
        });
      }

      const profile = await getProfileByFirebaseUid(
        firebaseUid
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
        });
      }

      if (profile.role !== "rider") {
        return res.status(403).json({
          success: false,
          error:
            "Only riders can modify offers",
        });
      }

      await client.query("BEGIN");

      const offerResult = await client.query(
        `
        SELECT
          o.id,
          o.ride_request_id,
          o.rider_id,
          o.offer_amount,
          o.status,
          r.status AS ride_status,
          r.assigned_rider_id
        FROM public.ride_offers o

        JOIN public.ride_requests r
          ON r.id = o.ride_request_id

        WHERE o.id = $1
          AND o.ride_request_id = $2
          AND o.rider_id = $3

        FOR UPDATE OF o, r
        `,
        [offerId, rideId, profile.id]
      );

      if (offerResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          error: "Offer not found",
        });
      }

      const offer = offerResult.rows[0];

      if (offer.status !== "pending") {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error:
            "Only pending offers can be modified",
        });
      }

      if (action === "withdraw") {
        await client.query(
          `
          UPDATE public.ride_offers
          SET
            status = 'withdrawn',
            updated_at = NOW()
          WHERE id = $1
          `,
          [offerId]
        );

        await client.query("COMMIT");

        return res.json({
          success: true,
          message: "Offer withdrawn",
        });
      }

      if (
        typeof offerAmount !== "number" ||
        !Number.isFinite(offerAmount) ||
        offerAmount <= 0
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          error:
            "A positive offerAmount is required when updating an offer",
        });
      }

      if (
        !MATCHABLE_RIDE_STATUSES.includes(
          offer.ride_status
        )
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error:
            "Ride is no longer accepting offer changes",
        });
      }

      if (offer.assigned_rider_id) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Ride has already been matched",
        });
      }

      const updatedResult = await client.query(
        `
        UPDATE public.ride_offers
        SET
          offer_amount = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING
          id,
          ride_request_id,
          rider_id,
          offer_amount,
          status,
          created_at,
          updated_at
        `,
        [offerAmount, offerId]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        offer: updatedResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Update ride offer error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Failed to update ride offer",
      });
    } finally {
      client.release();
    }
  }
);

/*
|--------------------------------------------------------------------------
| PASSENGER ACCEPT OFFER
|--------------------------------------------------------------------------
*/

router.post(
  "/:rideId/offers/:offerId/accept",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await db.connect();

    try {
      const firebaseUid = req.user?.uid;
      const { rideId, offerId } = req.params;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error:
            "Authenticated Firebase user ID not found",
        });
      }

      await client.query("BEGIN");

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
        });
      }

      const profile = profileResult.rows[0];

      if (profile.role !== "passenger") {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error:
            "Only passengers can accept offers",
        });
      }

      if (!profile.is_active) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "RIDEX account is inactive",
        });
      }

      const rideResult = await client.query(
        `
        SELECT
          id,
          passenger_id,
          status,
          assigned_rider_id
        FROM public.ride_requests
        WHERE id = $1
        FOR UPDATE
        `,
        [rideId]
      );

      if (rideResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          error: "Ride not found",
        });
      }

      const ride = rideResult.rows[0];

      if (ride.passenger_id !== profile.id) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error: "You do not own this ride",
        });
      }

      if (
        !MATCHABLE_RIDE_STATUSES.includes(
          ride.status
        )
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error:
            "Ride is no longer available for matching",
          rideStatus: ride.status,
        });
      }

      if (ride.assigned_rider_id) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Ride has already been matched",
        });
      }

      const offerResult = await client.query(
        `
        SELECT
          o.id,
          o.rider_id,
          o.offer_amount,
          o.status
        FROM public.ride_offers o
        WHERE o.id = $1
          AND o.ride_request_id = $2
        FOR UPDATE
        `,
        [offerId, rideId]
      );

      if (offerResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          error: "Offer not found",
        });
      }

      const offer = offerResult.rows[0];

      if (offer.status !== "pending") {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Offer is no longer available",
          offerStatus: offer.status,
        });
      }

      /*
       * Verify the rider still exists and is approved.
       */
      const riderResult = await client.query(
        `
        SELECT
          rp.id,
          rp.verification_status,
          rp.is_online,
          p.is_active
        FROM public.rider_profiles rp

        JOIN public.profiles p
          ON p.id = rp.id

        WHERE rp.id = $1
        LIMIT 1
        `,
        [offer.rider_id]
      );

      if (riderResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error:
            "Rider profile no longer exists",
        });
      }

      const rider = riderResult.rows[0];

      if (
        !rider.is_active ||
        rider.verification_status !== "approved"
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error:
            "Rider is no longer eligible",
        });
      }

      /*
       * MATCH THE RIDE.
       */
      const matchedRideResult = await client.query(
        `
        UPDATE public.ride_requests
        SET
          status = 'matched',
          assigned_rider_id = $1,
          agreed_fare = $2,
          accepted_offer_id = $3,
          matched_at = NOW(),
          updated_at = NOW()
        WHERE id = $4
          AND assigned_rider_id IS NULL
        RETURNING
          id,
          passenger_id,
          assigned_rider_id,
          agreed_fare,
          accepted_offer_id,
          status,
          matched_at
        `,
        [
          offer.rider_id,
          offer.offer_amount,
          offer.id,
          rideId,
        ]
      );

      if (matchedRideResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error: "Ride could not be matched",
        });
      }

      /*
       * Accepted offer.
       */
      await client.query(
        `
        UPDATE public.ride_offers
        SET
          status = 'accepted',
          updated_at = NOW()
        WHERE id = $1
        `,
        [offer.id]
      );

      /*
       * Every other pending offer becomes invalid.
       */
      await client.query(
        `
        UPDATE public.ride_offers
        SET
          status = 'superseded',
          updated_at = NOW()
        WHERE ride_request_id = $1
          AND id <> $2
          AND status = 'pending'
        `,
        [rideId, offer.id]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Ride matched successfully",
        ride: matchedRideResult.rows[0],
        riderId: offer.rider_id,
        agreedFare: offer.offer_amount,
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Accept ride offer error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to accept ride offer",
      });
    } finally {
      client.release();
    }
  }
);

/*
|--------------------------------------------------------------------------
| CANCEL RIDE
|--------------------------------------------------------------------------
*/

router.post(
  "/:rideId/cancel",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await db.connect();

    try {
      const firebaseUid = req.user?.uid;
      const { rideId } = req.params;
      const { reason } = req.body;

      if (!firebaseUid) {
        return res.status(401).json({
          success: false,
          error:
            "Authenticated Firebase user ID not found",
        });
      }

      const profile = await getProfileByFirebaseUid(
        firebaseUid
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "RIDEX profile not found",
        });
      }

      if (!profile.is_active) {
        return res.status(403).json({
          success: false,
          error: "RIDEX account is inactive",
        });
      }

      await client.query("BEGIN");

      const rideResult = await client.query(
        `
        SELECT
          id,
          passenger_id,
          assigned_rider_id,
          status
        FROM public.ride_requests
        WHERE id = $1
        FOR UPDATE
        `,
        [rideId]
      );

      if (rideResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          error: "Ride not found",
        });
      }

      const ride = rideResult.rows[0];

      const canCancel =
        ride.passenger_id === profile.id ||
        ride.assigned_rider_id === profile.id;

      if (!canCancel) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          error:
            "You do not have permission to cancel this ride",
        });
      }

      if (
        !ACTIVE_RIDE_STATUSES.includes(
          ride.status
        )
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          error:
            "Ride cannot be cancelled in its current state",
          rideStatus: ride.status,
        });
      }

      await client.query(
        `
        UPDATE public.ride_requests
        SET
          status = 'cancelled',
          cancelled_at = NOW(),
          cancellation_reason = $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [
          typeof reason === "string"
            ? reason.slice(0, 500)
            : null,
          rideId,
        ]
      );

      await client.query(
        `
        UPDATE public.ride_offers
        SET
          status = 'expired',
          updated_at = NOW()
        WHERE ride_request_id = $1
          AND status = 'pending'
        `,
        [rideId]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Ride cancelled successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Cancel ride error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Failed to cancel ride",
      });
    } finally {
      client.release();
    }
  }
);

export default router;