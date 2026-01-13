/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper handling of server-side PDF generation
  serverExternalPackages: ['pdfkit'],
};

module.exports = nextConfig;
