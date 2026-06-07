/**
 * Smoke-test configuration from the environment. Credentials are optional:
 * specs that need them skip when absent, so the `@prod-safe` read-only subset
 * runs with just SMOKE_BASE_URL.
 */
function v(name: string): string {
  return process.env[name] ?? "";
}

const baseURL = (v("SMOKE_BASE_URL") || v("BASE_URL")).replace(/\/$/, "");

export const smoke = {
  baseURL,
  origin: baseURL,
  customer: { email: v("SMOKE_CUSTOMER_EMAIL"), password: v("SMOKE_CUSTOMER_PASSWORD") },
  admin: { username: v("SMOKE_ADMIN_USERNAME"), password: v("SMOKE_ADMIN_PASSWORD") },
  cronSecret: v("SMOKE_CRON_SECRET"),
};

export const hasCustomer = Boolean(smoke.customer.email && smoke.customer.password);
export const hasAdmin = Boolean(smoke.admin.username && smoke.admin.password);
export const hasCron = Boolean(smoke.cronSecret);
