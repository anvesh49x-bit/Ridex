import { Router, Response } from 'express';
import { db } from '../config/database.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

async function getUserId(req: AuthenticatedRequest): Promise<string | null> {
  const firebaseUid = req.user?.uid;

  if (!firebaseUid) {
    return null;
  }

  const result = await db.query(
    'SELECT id FROM public.profiles WHERE firebase_uid = $1 LIMIT 1',
    [firebaseUid]
  );

  return result.rows[0]?.id ?? null;
}

async function getRiderProfile(riderId: string) {
  const result = await db.query(
    `
      SELECT
        rp.id,
        rp.verification_status,
        rp.date_of_birth,
        rp.gender,
        rp.address,
        rp.emergency_contact_name,
        rp.emergency_contact_phone,
        rp.is_online,
        rp.service_radius_m,
        rp.created_at,
        rp.updated_at
      FROM public.rider_profiles rp
      WHERE rp.id = $1
      LIMIT 1
    `,
    [riderId],
  );

  return result.rows[0] ?? null;
}

async function getActiveApplication(riderId: string) {
  const result = await db.query(
    `
      SELECT
        id,
        rider_id,
        status,
        submitted_at,
        reviewed_at,
        reviewed_by,
        rejection_reason,
        correction_reason,
        created_at,
        updated_at
      FROM public.rider_applications
      WHERE rider_id = $1
        AND status IN (
          'draft',
          'submitted',
          'under_review',
          'correction_required'
        )
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [riderId],
  );

  return result.rows[0] ?? null;
}

/*
|--------------------------------------------------------------------------
| GET /api/rider/application
|--------------------------------------------------------------------------
|
| Returns the current rider onboarding application.
|
*/

router.get(
  '/application',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const riderId = await getUserId(req);

      if (!riderId) {
        return res.status(401).json({
          success: false,
          message: 'Authenticated user not found.',
        });
      }

      const rider = await getRiderProfile(riderId);

      if (!rider) {
        return res.status(404).json({
          success: false,
          code: 'RIDER_NOT_REGISTERED',
          message: 'Rider capability has not been created.',
        });
      }

      let application = await getActiveApplication(riderId);

      /*
       * A rider capability can exist before onboarding starts.
       * In that situation create the first draft application.
       */
      if (!application) {
        const existing = await db.query(
          `
            SELECT
              id,
              rider_id,
              status,
              submitted_at,
              reviewed_at,
              reviewed_by,
              rejection_reason,
              correction_reason,
              created_at,
              updated_at
            FROM public.rider_applications
            WHERE rider_id = $1
            ORDER BY created_at DESC
            LIMIT 1
          `,
          [riderId],
        );

        application = existing.rows[0] ?? null;
      }

      if (!application) {
        const created = await db.query(
          `
            INSERT INTO public.rider_applications (
              rider_id,
              status
            )
            VALUES ($1, 'draft')
            RETURNING
              id,
              rider_id,
              status,
              submitted_at,
              reviewed_at,
              reviewed_by,
              rejection_reason,
              correction_reason,
              created_at,
              updated_at
          `,
          [riderId],
        );

        application = created.rows[0];
      }

      const vehicleResult = await db.query(
        `
          SELECT
            id,
            vehicle_type,
            make,
            model,
            color,
            registration_number,
            registration_year,
            is_active
          FROM public.vehicles
          WHERE rider_id = $1
            AND is_active = TRUE
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [riderId],
      );

      const documentsResult = await db.query(
        `
          SELECT
            id,
            document_type,
            status,
            created_at,
            updated_at
          FROM public.rider_documents
          WHERE rider_id = $1
          ORDER BY created_at ASC
        `,
        [riderId],
      );

      return res.json({
        success: true,
        application,
        rider,
        vehicle: vehicleResult.rows[0] ?? null,
        documents: documentsResult.rows,
      });
    } catch (error) {
      console.error('[RIDER APPLICATION] GET error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to load rider application.',
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| PUT /api/rider/application/personal
|--------------------------------------------------------------------------
|
| Saves personal details.
|
*/

router.put(
  '/application/personal',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const riderId = await getUserId(req);

      if (!riderId) {
        return res.status(401).json({
          success: false,
          message: 'Authenticated user not found.',
        });
      }

      const rider = await getRiderProfile(riderId);

      if (!rider) {
        return res.status(404).json({
          success: false,
          code: 'RIDER_NOT_REGISTERED',
          message: 'Rider capability has not been created.',
        });
      }

      const {
        dateOfBirth,
        gender,
        address,
        emergencyContactName,
        emergencyContactPhone,
      } = req.body ?? {};

      const application = await getActiveApplication(riderId);

      if (application?.status === 'submitted' ||
          application?.status === 'under_review') {
        return res.status(409).json({
          success: false,
          code: 'APPLICATION_LOCKED',
          message: 'This application is already under review.',
        });
      }

      await db.query(
        `
          UPDATE public.rider_profiles
          SET
            date_of_birth = COALESCE($2, date_of_birth),
            gender = COALESCE($3, gender),
            address = COALESCE($4, address),
            emergency_contact_name = COALESCE($5, emergency_contact_name),
            emergency_contact_phone = COALESCE($6, emergency_contact_phone),
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          riderId,
          dateOfBirth ?? null,
          gender ?? null,
          address ?? null,
          emergencyContactName ?? null,
          emergencyContactPhone ?? null,
        ],
      );

      return res.json({
        success: true,
        message: 'Personal details saved successfully.',
      });
    } catch (error) {
      console.error('[RIDER APPLICATION] Personal details error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to save personal details.',
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| PUT /api/rider/application/vehicle
|--------------------------------------------------------------------------
|
| Creates or updates the rider's active vehicle.
|
*/

router.put(
  '/application/vehicle',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const riderId = await getUserId(req);

      if (!riderId) {
        return res.status(401).json({
          success: false,
          message: 'Authenticated user not found.',
        });
      }

      const rider = await getRiderProfile(riderId);

      if (!rider) {
        return res.status(404).json({
          success: false,
          code: 'RIDER_NOT_REGISTERED',
          message: 'Rider capability has not been created.',
        });
      }

      const application = await getActiveApplication(riderId);

      if (
        application?.status === 'submitted' ||
        application?.status === 'under_review'
      ) {
        return res.status(409).json({
          success: false,
          code: 'APPLICATION_LOCKED',
          message: 'This application is already under review.',
        });
      }

      const {
        vehicleType,
        make,
        model,
        color,
        registrationNumber,
        registrationYear,
      } = req.body ?? {};

      const allowedVehicleTypes = [
        'bike',
        'scooter',
        'auto',
        'car',
      ];

      if (!allowedVehicleTypes.includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle type.',
        });
      }

      if (
        typeof registrationNumber !== 'string' ||
        registrationNumber.trim().length < 3
      ) {
        return res.status(400).json({
          success: false,
          message: 'Valid registration number is required.',
        });
      }

      await db.query(
        `
          UPDATE public.vehicles
          SET
            is_active = FALSE,
            updated_at = NOW()
          WHERE rider_id = $1
            AND is_active = TRUE
        `,
        [riderId],
      );

      const result = await db.query(
        `
          INSERT INTO public.vehicles (
            rider_id,
            vehicle_type,
            make,
            model,
            color,
            registration_number,
            registration_year,
            is_active
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            TRUE
          )
          RETURNING
            id,
            vehicle_type,
            make,
            model,
            color,
            registration_number,
            registration_year,
            is_active
        `,
        [
          riderId,
          vehicleType,
          make ?? null,
          model ?? null,
          color ?? null,
          registrationNumber.trim().toUpperCase(),
          registrationYear ?? null,
        ],
      );

      return res.json({
        success: true,
        message: 'Vehicle details saved successfully.',
        vehicle: result.rows[0],
      });
    } catch (error: any) {
      console.error('[RIDER APPLICATION] Vehicle error:', error);

      if (error?.code === '23505') {
        return res.status(409).json({
          success: false,
          code: 'REGISTRATION_ALREADY_EXISTS',
          message: 'This vehicle registration number is already registered.',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to save vehicle details.',
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| POST /api/rider/application/submit
|--------------------------------------------------------------------------
|
| Final onboarding submission.
|
| IMPORTANT:
| This endpoint is the point where the application becomes submitted.
|
*/

router.post(
  '/application/submit',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const client = await db.connect();

    try {
      const riderId = await getUserId(req);

      if (!riderId) {
        return res.status(401).json({
          success: false,
          message: 'Authenticated user not found.',
        });
      }

      await client.query('BEGIN');

      const riderResult = await client.query(
        `
          SELECT
            id,
            date_of_birth,
            gender,
            address,
            emergency_contact_name,
            emergency_contact_phone
          FROM public.rider_profiles
          WHERE id = $1
          FOR UPDATE
        `,
        [riderId],
      );

      if (riderResult.rowCount === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          success: false,
          code: 'RIDER_NOT_REGISTERED',
          message: 'Rider capability has not been created.',
        });
      }

      const rider = riderResult.rows[0];

      const vehicleResult = await client.query(
        `
          SELECT id
          FROM public.vehicles
          WHERE rider_id = $1
            AND is_active = TRUE
          LIMIT 1
        `,
        [riderId],
      );

      const documentsResult = await client.query(
        `
          SELECT id
          FROM public.rider_documents
          WHERE rider_id = $1
        `,
        [riderId],
      );

      const missingFields: string[] = [];

      if (!rider.date_of_birth) {
        missingFields.push('dateOfBirth');
      }

      if (!rider.gender) {
        missingFields.push('gender');
      }

      if (!rider.address) {
        missingFields.push('address');
      }

      if (!rider.emergency_contact_name) {
        missingFields.push('emergencyContactName');
      }

      if (!rider.emergency_contact_phone) {
        missingFields.push('emergencyContactPhone');
      }

      if (vehicleResult.rowCount === 0) {
        missingFields.push('vehicle');
      }

      if (documentsResult.rowCount === 0) {
        missingFields.push('documents');
      }

      if (missingFields.length > 0) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          code: 'APPLICATION_INCOMPLETE',
          message: 'Complete all required rider information before submitting.',
          missingFields,
        });
      }

      const applicationResult = await client.query(
        `
          SELECT
            id,
            status
          FROM public.rider_applications
          WHERE rider_id = $1
            AND status IN (
              'draft',
              'correction_required'
            )
          ORDER BY created_at DESC
          LIMIT 1
          FOR UPDATE
        `,
        [riderId],
      );

      if (applicationResult.rowCount === 0) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          success: false,
          code: 'APPLICATION_NOT_EDITABLE',
          message: 'There is no editable rider application.',
        });
      }

      const application = applicationResult.rows[0];

      const updated = await client.query(
        `
          UPDATE public.rider_applications
          SET
            status = 'submitted',
            submitted_at = NOW(),
            reviewed_at = NULL,
            reviewed_by = NULL,
            rejection_reason = NULL,
            correction_reason = NULL,
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            rider_id,
            status,
            submitted_at,
            reviewed_at,
            reviewed_by,
            rejection_reason,
            correction_reason,
            created_at,
            updated_at
        `,
        [application.id],
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'Rider application submitted successfully.',
        application: updated.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');

      console.error('[RIDER APPLICATION] Submit error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to submit rider application.',
      });
    } finally {
      client.release();
    }
  },
);

export default router;
