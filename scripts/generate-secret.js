#!/usr/bin/env node

/**
 * Generate a secure random secret key for SESSION_SECRET
 * Usage: node scripts/generate-secret.js
 */

const crypto = require('crypto');

// Generate a 32-byte (256-bit) random secret and encode as base64
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n✅ Generated SESSION_SECRET:');
console.log(secret);
console.log('\n📋 Add this to your .env.local file:');
console.log(`SESSION_SECRET=${secret}\n`);
