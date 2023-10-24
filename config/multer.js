const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
dotenv.config({ path: `config/config.env` });

// Configure AWS
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueFileName = generateUniqueFileName(file);
      const fileFolder = folder ? folder + "/" : "";
      cb(null, `${fileFolder}${uniqueFileName}`);
    },
  });

  return multer({
    storage: s3Storage,
  });
};

module.exports = storage;
