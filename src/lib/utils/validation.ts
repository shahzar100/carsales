/**
 * INPUT VALIDATION & SANITIZATION UTILITIES
 * 
 * Provides validation and sanitization functions for user inputs
 * to prevent XSS, SQL injection, and other security vulnerabilities.
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string } {
  const sanitized = sanitizeString(email, 254).toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return {
    valid: emailRegex.test(sanitized),
    sanitized,
  };
}

/**
 * Validate and sanitize phone number
 */
export function validatePhone(phone: string): { valid: boolean; sanitized: string } {
  const sanitized = phone.replace(/[^\d+\s()-]/g, "").slice(0, 20);
  const phoneRegex = /^[\d\s+()-]{7,20}$/;
  
  return {
    valid: phoneRegex.test(sanitized),
    sanitized,
  };
}

/**
 * Validate booking reference format (BK-XXXXXX or QT-XXXXXX)
 */
export function validateBookingReference(ref: string): boolean {
  const refRegex = /^(BK|QT)-[A-Z0-9]{6}$/;
  return refRegex.test(ref);
}

/**
 * Sanitize name field
 */
export function sanitizeName(name: string): string {
  return sanitizeString(name, 100).replace(/[^a-zA-Z\s'-]/g, "");
}

/**
 * Validate date is in future and within reasonable range
 */
export function validateFutureDate(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);
    
    return date > now && date < oneYearFromNow;
  } catch {
    return false;
  }
}

/**
 * Validate appointment time format
 */
export function validateAppointmentTime(time: string): boolean {
  const validTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  return validTimes.includes(time);
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis or a dedicated rate limiting service
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Clean up old rate limit records (call periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(key);
    }
  }
}
