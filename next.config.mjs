/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pino-pretty"],
  transpilePackages: ["thirdweb"],
};

export default nextConfig;
