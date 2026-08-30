const dotenv = require('dotenv');
const path = require('path');

// Guarantee .env is loaded before reading credentials
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Safe diagnostic check (without printing secret values)
const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;

if (!hasCloudName || !hasApiKey || !hasApiSecret) {
  console.warn('⚠️  Cloudinary configuration incomplete in server/.env:', {
    CLOUDINARY_CLOUD_NAME: hasCloudName,
    CLOUDINARY_API_KEY: hasApiKey,
    CLOUDINARY_API_SECRET: hasApiSecret,
  });
}

module.exports = cloudinary;
