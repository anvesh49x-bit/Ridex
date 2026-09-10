import { Stack, useRouter, useSegments } from "expo-router";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

const API_URL = "http://10.134.158.132:3000";

type AuthState = "loading" | "authenticated" | "unauthenticated";

type MeResponse = {
  success?: boolean;
  accountStatus?: string;

  capabilities?: {
    passenger?: boolean;
    rider?: boolean;
  };

  riderStatus?: string;
  riderApplicationStatus?: string | null;

  user?: {
    id: string;
    firebase_uid: string;
    is_active: boolean;
    role: string;
    has_rider_capability?: boolean;
    verification_status?: string | null;
  };
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [authState, setAuthState] = useState<AuthState>("loading");

  const navigationLock = useRef(false);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        console.log(
          "[RIDEX AUTH] Firebase session:",
          firebaseUser?.uid ?? "none"
        );

        /*
         * ---------------------------------------------------------
         * NO FIREBASE USER
         * ---------------------------------------------------------
         */
        if (!firebaseUser) {
          navigationLock.current = false;

          setAuthState("unauthenticated");

          if (segments[0] !== "auth") {
            router.replace("/auth");
          }

          return;
        }

        /*
         * ---------------------------------------------------------
         * FIREBASE USER EXISTS
         * ---------------------------------------------------------
         */

        try {
          const idToken = await firebaseUser.getIdToken();

          const response = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          });

          const data: MeResponse = await response.json();

          console.log("[RIDEX AUTH] Backend response:", data);

          /*
           * -------------------------------------------------------
           * RIDEX ACCOUNT VALIDATION
           * -------------------------------------------------------
           */

          if (
            !response.ok ||
            data.success !== true ||
            !data.user ||
            data.user.is_active !== true
          ) {
            console.log(
              "[RIDEX AUTH] RIDEX account unavailable"
            );

            navigationLock.current = false;

            setAuthState("unauthenticated");

            if (segments[0] !== "auth") {
              router.replace("/auth");
            }

            return;
          }

          /*
           * -------------------------------------------------------
           * RIDER CAPABILITY
           * -------------------------------------------------------
           *
           * Rider capability is determined by rider_profiles.
           *
           * profiles.role is NOT used.
           */

          const hasRiderCapability =
            data.capabilities?.rider === true ||
            data.user.has_rider_capability === true;

          /*
           * Existing RIDEX passenger without rider capability.
           *
           * Start rider registration/setup.
           */
          if (!hasRiderCapability) {
            console.log(
              "[RIDEX AUTH] Rider capability not found."
            );

            navigationLock.current = false;

            setAuthState("authenticated");

            if (segments[0] !== "personal-details") {
              router.replace("/personal-details");
            }

            return;
          }

          setAuthState("authenticated");

          /*
           * -------------------------------------------------------
           * RIDER APPLICATION STATUS
           * -------------------------------------------------------
           *
           * This is now the PRIMARY onboarding state.
           *
           * riderApplicationStatus:
           *
           * draft
           * submitted
           * under_review
           * correction_required
           * approved
           * rejected
           */

          const applicationStatus =
            data.riderApplicationStatus ?? "draft";

          console.log(
            "[RIDEX AUTH] Rider application status:",
            applicationStatus
          );

          /*
           * -------------------------------------------------------
           * PREVENT DUPLICATE NAVIGATION
           * -------------------------------------------------------
           */

          if (navigationLock.current) {
            console.log(
              "[RIDEX AUTH] Navigation already handled"
            );

            return;
          }

          navigationLock.current = true;

          /*
           * -------------------------------------------------------
           * CURRENT ROUTE
           * -------------------------------------------------------
           */

          const currentRoute = segments[0];

          const riderScreens = [
            "home",
            "explore",
            "rides",
            "active-ride",
            "ride-confirmed",
            "ride-completed",
            "vehicle-details",
            "verification-pending",
            "documents",
            "personal-details",
          ];

          /*
           * -------------------------------------------------------
           * APPROVED RIDER
           * -------------------------------------------------------
           *
           * SIMPLE RULE:
           *
           * If rider application is approved,
           * rider can enter the Rider Home.
           */

          if (applicationStatus === "approved") {
            console.log(
              "[RIDEX AUTH] Existing approved rider → Home"
            );

            if (currentRoute !== "home") {
              router.replace("/home");
            }

            return;
          }

          /*
           * -------------------------------------------------------
           * APPLICATION SUBMITTED / UNDER REVIEW
           * -------------------------------------------------------
           *
           * Rider has completed setup.
           *
           * Do NOT send them to Home.
           */

          if (
            applicationStatus === "submitted" ||
            applicationStatus === "under_review"
          ) {
            console.log(
              "[RIDEX AUTH] Application submitted → Verification Pending"
            );

            if (currentRoute !== "verification-pending") {
              router.replace("/verification-pending");
            }

            return;
          }

          /*
           * -------------------------------------------------------
           * REJECTED
           * -------------------------------------------------------
           *
           * Temporary fallback until we create a proper
           * rejected application screen.
           */

          if (applicationStatus === "rejected") {
            console.log(
              "[RIDEX AUTH] Application rejected"
            );

            if (currentRoute !== "verification-pending") {
              router.replace("/verification-pending");
            }

            return;
          }

          /*
           * -------------------------------------------------------
           * DRAFT / CORRECTION REQUIRED
           * -------------------------------------------------------
           *
           * Rider has not completed setup.
           *
           * Send them into the onboarding flow.
           */

          if (
            applicationStatus === "draft" ||
            applicationStatus === "correction_required"
          ) {
            console.log(
              "[RIDEX AUTH] Rider setup required → Personal Details"
            );

            if (currentRoute !== "personal-details") {
              router.replace("/personal-details");
            }

            return;
          }

          /*
           * -------------------------------------------------------
           * UNKNOWN STATE
           * -------------------------------------------------------
           *
           * Safe fallback:
           * continue rider setup rather than opening Home.
           */

          console.log(
            "[RIDEX AUTH] Unknown application status:",
            applicationStatus
          );

          router.replace("/personal-details");
        } catch (error) {
          console.error(
            "[RIDEX AUTH] Backend authentication error:",
            error
          );

          navigationLock.current = false;

          setAuthState("unauthenticated");

          if (segments[0] !== "auth") {
            router.replace("/auth");
          }
        }
      }
    );

    return unsubscribe;
  }, []);

  /*
   * -------------------------------------------------------------
   * LOADING
   * -------------------------------------------------------------
   */

  if (authState === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /*
   * -------------------------------------------------------------
   * APP STACK
   * -------------------------------------------------------------
   */

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#ffffff",
  },
};