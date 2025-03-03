const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PORT = process.env.BASE_URL || 5000;
// Function to create multer storage and handle file uploads
const fileUpload = (
  folder = "uploads",
  allowedTypes = /jpeg|jpg|png|pdf/,
  maxSize = 10 * 1024 * 1024
) => {
  folder = path.join(__dirname, `../${folder}`);

  // Function to ensure the directory exists
  const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  };
  ensureDirectoryExists(folder);

  // Set up storage destination and filename
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, folder); // Set the destination folder 
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname); // Get the file extension
      cb(null, Date.now() + ext); // Generate unique filename with timestamp
    },
  });

  // Initialize multer with storage and file validation
  const upload = multer({
    storage: storage,
    limits: { fileSize: maxSize }, // Limit file size (default 5MB)
    fileFilter: (req, file, cb) => {
      const mimetype = allowedTypes.test(file.mimetype);
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );

      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error(`Only ${allowedTypes} formats allowed!`));
    },
  });

  return upload;
};

module.exports = fileUpload;
