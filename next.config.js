const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Define the "@/..." path alias explicitly at the webpack level so module
    // resolution doesn't depend solely on the tsconfig-paths integration.
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

module.exports = nextConfig;
