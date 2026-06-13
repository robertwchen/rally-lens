/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Type errors still fail the build (we want strict typechecking); lint is run
  // separately so a style nit never blocks a deploy.
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    // Optional convenience proxy so the browser can hit /api/* in dev.
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${api}/:path*` }];
  },
};

export default nextConfig;
