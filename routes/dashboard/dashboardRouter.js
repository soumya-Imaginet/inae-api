const express = require("express");
const { dashboardData } = require("../../controllers/dashboard/dashboardController");

const router = express.Router();

router.post("/admin", dashboardData);

module.exports = router;
