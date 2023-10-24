const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const dotenv = require("dotenv");
dotenv.config();
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateUniqueFileName = (file) => {
  const originalName = file.originalname;
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15); // Generates a random string

  // Combine the original filename, timestamp, and random string to create a unique name
  return `${originalName}-${timestamp}-${randomString}`;
};

const storage = (folder = "general") => {
  const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder, // Specify the folder in your Cloudinary account
      public_id: (req, file) => generateUniqueFileName(file), // Rename the file on upload
      // format: async (req, file) => "png", // supports promises as well
    },
  });

  return multer({
    storage: cloudinaryStorage,
  });
};

module.exports = storage;
