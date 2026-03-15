/**
 * EMAIL INDEX — barrel exports for all templates & utilities
 */

// ── Templates ────────────────────────────────────────────────
export { ServiceBookingConfirmation } from "./ServiceBookingConfirmation";
export { CarViewingConfirmation } from "./CarViewingConfirmation";
export { BookingCancellation } from "./BookingCancellation";
export { PasswordReset } from "./PasswordReset";

// ── Review invite templates ─────────────────────────────────
export { ReviewInviteService } from "./ReviewInviteService";
export { ReviewInviteViewing } from "./ReviewInviteViewing";
export { ReviewInviteRepair } from "./ReviewInviteRepair";
export { ReviewInviteRecovery } from "./ReviewInviteRecovery";
export { ReviewInviteDetailing } from "./ReviewInviteDetailing";
export { ReviewInviteTinting } from "./ReviewInviteTinting";

// ── Shared components (for custom one-off emails) ────────────
export {
  EmailTemplate,
  DetailRow,
  ReferenceBox,
  EmailButton,
  SectionHeading,
} from "./template/EmailTemplate";
export type { HeaderStyle } from "./template/EmailTemplate";

// ── Send utility ─────────────────────────────────────────────
export { sendEmail } from "./send";
