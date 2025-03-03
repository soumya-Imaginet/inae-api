const express = require("express");
const router = express.Router();
const authController = require("../../controllers/auth/authController");

router.post("/verify", authController.auth);
router.post("/verify-otp", authController.auth);

module.exports = router;
