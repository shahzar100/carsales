import type { DefaultSession } from "next-auth";

/**
 * Module augmentation so `session.user.id` is typed everywhere.
 * The id is populated from `token.sub` in the session callback
 * (see src/auth.ts).
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
