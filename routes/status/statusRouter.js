const { fetchStatus } = require("../../controllers/status/statusController");

// create router
const router = require("express").Router();

// all routes
router.post("/fetchStatusValues", fetchStatus);

// exporting router
module.exports = router;
