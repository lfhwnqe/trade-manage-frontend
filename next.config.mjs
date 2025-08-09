/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/default",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: `${process.env.API_BASE_URL}/:path*`,
      },
      // {
      //   source: "/api/:path*",
      //   destination: `${process.env.API_BASE_URL}/api/:path*`,
      // },
    ];
  },
};

export default nextConfig;
