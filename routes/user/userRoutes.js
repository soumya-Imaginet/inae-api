const {
  createUser,
  checkUserOTP,
  sendUserOTP,
  loginUser,
  userPasswordReset,
  userAdd,
  getUsers,
  getUserById,
  updateUser,
  getTotalCommitteeMemberCount
} = require("../../controllers/user/userController");
const fileUpload = require("../../helpers/fileUpload");
const multer = require("multer");
const upload = multer();
// create router
const router = require("express").Router();
const uploads = fileUpload("uploads/documents", /jpeg|jpg|/);


// all routes
router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/verify-otp", checkUserOTP);
router.post("/send-otp", sendUserOTP);
router.post("/reset-password", userPasswordReset);
router.post("/add", userAdd);
router.get("/total-committee-members",getTotalCommitteeMemberCount)
router.get("/fetchUser",getUserById);
router.get("/list",getUsers);
router.put("/update",uploads.any(),updateUser)
// exporting router
module.exports = router;