import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  [
    "script-src 'self'",
    "'unsafe-inline'",
    isDevelopment ? "'unsafe-eval'" : "",
    "https://www.paypal.com",
    "https://www.sandbox.paypal.com",
    "https://www.paypalobjects.com",
  ]
    .filter(Boolean)
    .join(" "),
  [
    "connect-src 'self'",
    "https://www.paypal.com",
    "https://www.sandbox.paypal.com",
    "https://www.paypalobjects.com",
    "https://api.paypal.com",
    "https://api.sandbox.paypal.com",
    "https://api.mercadopago.com",
    "https://*.mercadopago.com",
  ].join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://*.mercadopago.com",
  "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com https://*.mercadopago.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  isDevelopment ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy,
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, max-age=0, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
