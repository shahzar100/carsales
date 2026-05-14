// Auth.js mounts its entire flow (sign-in, callback, session, signout,
// magic-link verification, CSRF token) under this single catch-all route.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
