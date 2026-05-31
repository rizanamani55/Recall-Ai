import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the PDF.js CDN worker script
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com",
              "worker-src 'self' blob: https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://cdnjs.cloudflare.com",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Turbopack config (replaces webpack config in Next.js 16+)
  turbopack: {
    resolveAlias: {
      // Prevent pdfjs-dist from trying to load the optional 'canvas' native module
      canvas: { browser: "./node_modules/pdfjs-dist/build/pdf.mjs" },
    },
  },
};

export default nextConfig;
