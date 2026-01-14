/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using PDFKit standalone build which includes all font data
  // No need for webpack config to copy font files
};

module.exports = nextConfig;
