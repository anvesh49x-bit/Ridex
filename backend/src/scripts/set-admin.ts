import { firebaseAdminAuth } from "../config/firebase-admin.js";

async function main() {
  const uid = process.argv[2];

  if (!uid) {
    console.error(
      "Usage: npm exec tsx src/scripts/set-admin.ts <FIREBASE_UID>"
    );

    process.exit(1);
  }

  try {
    const user = await firebaseAdminAuth.getUser(uid);

    const existingClaims = user.customClaims ?? {};

    await firebaseAdminAuth.setCustomUserClaims(uid, {
      ...existingClaims,
      admin: true,
    });

    console.log("");
    console.log("==========================================");
    console.log(" RIDEX ADMIN ACCESS GRANTED");
    console.log("==========================================");
    console.log("");
    console.log("Firebase UID:", uid);
    console.log("Email:", user.email ?? "none");
    console.log("Phone:", user.phoneNumber ?? "none");
    console.log("");
    console.log("Admin claim: admin=true");
    console.log("");
    console.log(
      "The user must refresh their Firebase ID token before"
    );
    console.log("the new admin claim appears in the token.");
    console.log("");
  } catch (error) {
    console.error("Failed to grant admin access:", error);
    process.exit(1);
  }
}

main();