/*
|--------------------------------------------------------------------------
| 009 - Support dual Passenger + Rider accounts
|--------------------------------------------------------------------------
|
| A single Firebase identity can have:
|
|   profiles
|      +
|   rider_profiles
|
| This allows the same phone number to be both:
|
|   Passenger
|   Rider
|
| We keep profiles.role for backward compatibility with the existing
| application while rider capability is determined by rider_profiles.
|
|--------------------------------------------------------------------------
*/

/*
 * No destructive schema change is performed here.
 *
 * Existing passenger profiles remain passenger profiles.
 * Existing approved riders remain rider profiles.
 *
 * The important structural rule is:
 *
 *     rider_profiles.id = profiles.id
 *
 * which already exists in migration 003.
 *
 * This migration only adds indexes that make dual-capability
 * account lookups efficient and explicitly documents the model.
 */

CREATE INDEX IF NOT EXISTS profiles_firebase_uid_idx
ON public.profiles (firebase_uid);

CREATE INDEX IF NOT EXISTS rider_profiles_verification_status_idx
ON public.rider_profiles (verification_status);

CREATE INDEX IF NOT EXISTS rider_profiles_online_idx
ON public.rider_profiles (is_online)
WHERE is_online = TRUE;