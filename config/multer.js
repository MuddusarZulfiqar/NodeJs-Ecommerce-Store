const multer = require("multer");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
const dotenv = require("dotenv");
dotenv.config({ path: `config/config.env` });

// Configure AWS
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // Set your desired AWS region
});

const s3 = new aws.S3();

const generateUniqueFileName = (file) => {
  const originalName = file.originalname;
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15); // Generates a random string

  // Combine the original filename, timestamp, and random string to create a unique name
  return `${originalName}-${timestamp}-${randomString}`;
};

// for folders
const storage = (folder = "general") => {
  const s3Storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read", // Set the desired access control level
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueFileName = generateUniqueFileName(file);
      const fileFolder = folder ? folder + "/" : ""; // Include the folder if specified
      cb(null, `${fileFolder}${uniqueFileName}`);
    },
  });

  return multer({
    storage: s3Storage,
  });
};

module.exports = storage;
