import crypto from "crypto";

// ==========================================
// 1. TIMING-SAFE EQUALITY & HASHING (Item 9)
// ==========================================

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// ==========================================
// 2. CRYPTOGRAPHIC SIGNING & SESSIONS (Item 7)
// ==========================================

const SIGNING_SECRET =
  process.env.SESSION_SECRET ||
  process.env.ADMIN_ACCESS_KEY ||
  "syncink_fallback_signing_salt_do_not_use_in_prod";

/**
 * Create an HMAC-SHA256 signature for data string.
 */
export function signData(data: string, secret: string = SIGNING_SECRET): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

/**
 * Verify HMAC-SHA256 signature in constant time.
 */
export function verifySignature(data: string, signature: string, secret: string = SIGNING_SECRET): boolean {
  if (!data || !signature) return false;
  const expectedSignature = signData(data, secret);
  return timingSafeCompare(signature, expectedSignature);
}

/**
 * Create a cryptographically signed token: <payload_base64url>.<signature>
 */
export function createSignedToken<T = any>(payload: T, secret: string = SIGNING_SECRET): string {
  const jsonStr = JSON.stringify(payload);
  const data = Buffer.from(jsonStr, "utf-8").toString("base64url");
  const signature = signData(data, secret);
  return `${data}.${signature}`;
}

/**
 * Verify and decode a signed token. Returns null if forged or invalid.
 */
export function verifySignedToken<T = any>(token: string, secret: string = SIGNING_SECRET): T | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  if (!verifySignature(data, signature, secret)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf-8");
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

// ==========================================
// 3. CSRF ORIGIN / REFERER VALIDATION (Item 3)
// ==========================================

const ALLOWED_ORIGINS = new Set([
  "https://syncink.site",
  "https://www.syncink.site",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

/**
 * Verify CSRF protection for mutating requests (POST, PUT, PATCH, DELETE).
 * Checks Origin and Referer headers against trusted origins.
 */
export function validateCsrfOrigin(request: Request): boolean {
  // Allow safe HTTP methods
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // If origin is present, validate it
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (ALLOWED_ORIGINS.has(originUrl.origin)) return true;

      // Allow if origin matches host header
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      if (host && originUrl.host.toLowerCase() === host.toLowerCase()) return true;
    } catch {
      return false;
    }
  }

  // If referer is present, validate it
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (ALLOWED_ORIGINS.has(refererUrl.origin)) return true;

      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      if (host && refererUrl.host.toLowerCase() === host.toLowerCase()) return true;
    } catch {
      return false;
    }
  }

  // If neither origin nor referer is provided, check if it has a valid server Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return true; // Programmatic API access with bearer token
  }

  // Reject requests without Origin/Referer in browser context
  return false;
}

// ==========================================
// 4. SSRF PREVENTION & URL VALIDATION (Item 16)
// ==========================================

const DISALLOWED_IP_PATTERNS = [
  /^127\./,                         // Loopback
  /^10\./,                          // RFC 1918 private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // RFC 1918 private
  /^192\.168\./,                    // RFC 1918 private
  /^169\.254\./,                    // Link-local / AWS metadata
  /^0\./,                           // Zero address
  /^localhost$/i,
  /^::1$/,                          // IPv6 loopback
  /^fc00:/i,                       // IPv6 unique local
  /^fe80:/i,                       // IPv6 link local
];

/**
 * Validates that an outbound HTTP URL is safe and does not target internal services.
 */
export function isSafeOutboundUrl(urlString: string, allowedHosts?: string[]): boolean {
  try {
    const parsed = new URL(urlString);

    // Require HTTP or HTTPS
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // If allowed hosts specified, must match one of them
    if (allowedHosts && allowedHosts.length > 0) {
      const match = allowedHosts.some(
        (h) => hostname === h.toLowerCase() || hostname.endsWith(`.${h.toLowerCase()}`)
      );
      if (!match) return false;
    }

    // Check against disallowed IP / hostname patterns
    for (const pattern of DISALLOWED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

// ==========================================
// 5. FILE UPLOAD SECURITY (Item 4)
// ==========================================

export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "pdf"]);

/**
 * Inspect magic bytes of uploaded buffer to verify genuine file type.
 */
export function validateMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // GIF: 47 49 46 38 ('GIF8')
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  // PDF: 25 50 44 46 ('%PDF')
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return true;
  }

  return false;
}

/**
 * Sanitize filename to prevent directory traversal or remote script execution.
 */
export function sanitizeFileName(fileName: string): string {
  const parts = fileName.split(".");
  const ext = (parts.pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = parts.join("_").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `${base || "file"}.bin`;
  }

  return `${base || "upload"}.${ext}`;
}

// ==========================================
// 6. SENSITIVE LOG REDACTOR (Item 19)
// ==========================================

/**
 * Redact passwords, tokens, and database secrets from strings before logging.
 */
export function redactSensitive(message: string): string {
  if (typeof message !== "string") return String(message);

  return message
    // Redact postgres password in URLs: postgresql://user:PASSWORD@host
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, "$1***REDACTED***$3")
    // Redact discord bot tokens
    .replace(/(?:Bot|Bearer)\s+[A-Za-z0-9_-]{20,}/gi, "Bearer ***REDACTED***")
    // Redact webhook secrets in discord URLs
    .replace(/(discord(?:app)?\.com\/api\/webhooks\/\d+\/)([A-Za-z0-9_-]+)/gi, "$1***REDACTED***")
    // Redact admin keys or API keys in query params
    .replace(/([?&](?:key|secret|token|password)=)[^&]+/gi, "$1***REDACTED***");
}

// ==========================================
// 7. XSS SANITIZATION (Item 2)
// ==========================================

/**
 * Escape HTML characters to prevent XSS.
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== "string") return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize JSON string for safe embedding into <script> tags.
 */
export function safeJsonLdString(obj: any): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

// ==========================================
// 8. WEBHOOK SIGNATURE VERIFICATION (Item 15)
// ==========================================

/**
 * Verify cryptographic webhook signatures (HMAC-SHA256) in constant time.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!rawBody || !signatureHeader || !secret) return false;
  const signature = signatureHeader.replace(/^sha256=/i, "").trim();
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeCompare(signature, expected);
}

