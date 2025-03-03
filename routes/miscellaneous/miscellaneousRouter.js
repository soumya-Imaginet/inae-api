const { querySendToAdmin,getAllQueries,updateQuery, deleteImage} = require("../../controllers/miscellaneous/miscellaneousController");

// create router
const router = require("express").Router();

// all routes
router.post("/query/send", querySendToAdmin);
router.get("/queries", getAllQueries);
router.patch("/query/update/:id", updateQuery);
router.delete("/delete-image", deleteImage);


// exporting router
module.exports = router;
