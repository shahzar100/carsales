import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { getUsersCollection } from "@/lib/models";
import { logError } from "@/lib/utils/observability";
import { ok, unauthorized, notFound, serverError } from "@/lib/utils/apiResponse";

/**
 * DELETE /api/account — permanently delete the signed-in customer's
 * account.
 *
 * Removes the `users` document and the Auth.js adapter rows that hang
 * off it (`accounts` — linked OAuth providers; `verification_tokens` —
 * any pending magic links). Server-persisted saved cars live on the
 * user document, so they go with it.
 *
 * Bookings are deliberately NOT deleted: service appointments, viewings
 * and reservations are business transaction records the dealership has
 * to keep. They're keyed by email, not by a user id, so they simply
 * stop being linked to an account once it's gone.
 *
 * The client signs out immediately after a 200 — the JWT session cookie
 * is all that's left, and it's now pointing at a deleted user.
 */
export async function DELETE() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return unauthorized("You must be signed in");

    const users = await getUsersCollection();
    const user = await users.findOne({ email });
    if (!user) return notFound("Account not found");

    const db = (await clientPromise).db("MMC");
    await Promise.all([
      users.deleteOne({ _id: user._id }),
      db.collection("accounts").deleteMany({ userId: user._id }),
      db.collection("verification_tokens").deleteMany({ identifier: email }),
    ]);

    return ok({ message: "Account deleted." });
  } catch (error) {
    logError(error, { route: "DELETE /api/account" });
    return serverError();
  }
}
